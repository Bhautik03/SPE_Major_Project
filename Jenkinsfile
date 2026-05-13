pipeline {
    agent any

    environment {
        DOCKER_USER_REPO = 'bhautik03'
        DOCKER_CRED_ID = 'dockerhub-creds'
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Unit Tests') {
            steps {
                script {
                    echo "Running unit tests for all services..."
                    // Run tests inside a Node container to avoid local dependency issues
                    sh """
                        docker run --rm -v \$(pwd)/auth-service:/app -w /app node:20-alpine \
                          sh -c "npm install && npm test"
                    """
                    sh """
                        docker run --rm -v \$(pwd)/patient-service:/app -w /app node:20-alpine \
                          sh -c "npm install && npm test"
                    """
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    echo "Building and tagging images for all services..."

                    // Auth Service
                    sh """
                        docker build -t ${DOCKER_USER_REPO}/healthcare-auth:${BUILD_NUMBER} ./auth-service
                        docker tag ${DOCKER_USER_REPO}/healthcare-auth:${BUILD_NUMBER} ${DOCKER_USER_REPO}/healthcare-auth:latest
                    """

                    // Patient Service
                    sh """
                        docker build -t ${DOCKER_USER_REPO}/healthcare-patient:${BUILD_NUMBER} ./patient-service
                        docker tag ${DOCKER_USER_REPO}/healthcare-patient:${BUILD_NUMBER} ${DOCKER_USER_REPO}/healthcare-patient:latest
                    """

                    // Frontend Service
                    sh """
                        docker build -t ${DOCKER_USER_REPO}/healthcare-frontend:${BUILD_NUMBER} ./frontend
                        docker tag ${DOCKER_USER_REPO}/healthcare-frontend:${BUILD_NUMBER} ${DOCKER_USER_REPO}/healthcare-frontend:latest
                    """
                }
            }
        }

        stage('Trivy Security Scan') {
            steps {
                script {
                    echo "Running Trivy vulnerability scan on all images..."
                    sh """
                        docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            aquasec/trivy:latest image \
                            --severity CRITICAL,HIGH \
                            --no-progress \
                            --exit-code 0 \
                            ${DOCKER_USER_REPO}/healthcare-auth:${BUILD_NUMBER}
                    """
                    sh """
                        docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            aquasec/trivy:latest image \
                            --severity CRITICAL,HIGH \
                            --no-progress \
                            --exit-code 0 \
                            ${DOCKER_USER_REPO}/healthcare-patient:${BUILD_NUMBER}
                    """
                    sh """
                        docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            aquasec/trivy:latest image \
                            --severity CRITICAL,HIGH \
                            --no-progress \
                            --exit-code 0 \
                            ${DOCKER_USER_REPO}/healthcare-frontend:${BUILD_NUMBER}
                    """
                }
            }
        }

        stage('Push Docker Images') {
            steps {
                script {
                    echo "Logging into Docker Hub and pushing images..."
                    withCredentials([usernamePassword(
                        credentialsId: "${DOCKER_CRED_ID}",
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        sh '''
                            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                            # Push Auth
                            docker push ${DOCKER_USER_REPO}/healthcare-auth:${BUILD_NUMBER}
                            docker push ${DOCKER_USER_REPO}/healthcare-auth:latest

                            # Push Patient
                            docker push ${DOCKER_USER_REPO}/healthcare-patient:${BUILD_NUMBER}
                            docker push ${DOCKER_USER_REPO}/healthcare-patient:latest

                            # Push Frontend
                            docker push ${DOCKER_USER_REPO}/healthcare-frontend:${BUILD_NUMBER}
                            docker push ${DOCKER_USER_REPO}/healthcare-frontend:latest
                        '''
                    }
                }
            }
        }

        stage('Deploy via Ansible') {
            steps {
                script {
                    echo "Starting Ansible deployment..."
                    withCredentials([
                        string(credentialsId: 'JWT_SECRET', variable: 'JWT_SECRET'),
                        string(credentialsId: 'GOOGLE_CLIENT_ID', variable: 'GOOGLE_CLIENT_ID')
                    ]) {
                        sh '''
                            ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook -i ansible/inventory.ini ansible/deploy.yml \
                            -e "jwt_secret=${JWT_SECRET}" \
                            -e "google_client_id=${GOOGLE_CLIENT_ID}" \
                            -e "tag=${BUILD_NUMBER}"
                        '''
                    }
                }
            }
        }
    }

    post {
        success {
            emailext (
                subject: "SUCCESS: Build #${BUILD_NUMBER} - ${JOB_NAME}",
                body: """
BUILD SUCCESS !!!

Job Name     : ${JOB_NAME}
Build Number : ${BUILD_NUMBER}
Build URL    : ${BUILD_URL}

Stages Passed:
  ✅ Unit Tests (auth-service, patient-service)
  ✅ Build Docker Images
  ✅ Trivy Security Scan
  ✅ Push to Docker Hub
  ✅ Ansible Deployment

Images Pushed:
  - ${DOCKER_USER_REPO}/healthcare-auth:${BUILD_NUMBER}
  - ${DOCKER_USER_REPO}/healthcare-patient:${BUILD_NUMBER}
  - ${DOCKER_USER_REPO}/healthcare-frontend:${BUILD_NUMBER}
                """,
                to: "bhautikv03@gmail.com"
            )
        }

        failure {
            emailext (
                subject: "FAILED: Build #${BUILD_NUMBER} - ${JOB_NAME}",
                body: """
BUILD FAILED !!!

Job Name     : ${JOB_NAME}
Build Number : ${BUILD_NUMBER}
Check Logs   : ${BUILD_URL}

Please review the error in the Jenkins console immediately.
                """,
                to: "bhautikv03@gmail.com"
            )
        }
    }
}
