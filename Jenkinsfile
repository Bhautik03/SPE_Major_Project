pipeline {
    agent any

    environment {
        DOCKER_USER_REPO = 'bhautik03'
        // Credential ID you must create in Jenkins dashboard
        DOCKER_CRED_ID = 'dockerhub-creds'
    }

    stages {
        stage('Checkout Code') {
            steps {
                // checkout scm is the standard for Jenkins Pipeline jobs
                checkout scm
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
                    // Use Jenkins credentials to securely pass secrets into the Ansible playbook
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

                Job Name: ${JOB_NAME}
                Build Number: ${BUILD_NUMBER}
                Build URL: ${BUILD_URL}

                Microservices Pushed:
                - ${DOCKER_USER_REPO}/healthcare-auth:${BUILD_NUMBER} / latest
                - ${DOCKER_USER_REPO}/healthcare-patient:${BUILD_NUMBER} / latest
                - ${DOCKER_USER_REPO}/healthcare-frontend:${BUILD_NUMBER} / latest

                All images built and pushed successfully to Docker Hub.
                """,
                to: "bhautikv03@gmail.com"
            )
        }

        failure {
            emailext (
                subject: "FAILED: Build #${BUILD_NUMBER} - ${JOB_NAME}",
                body: """
                BUILD FAILED !!!

                Job Name: ${JOB_NAME}
                Build Number: ${BUILD_NUMBER}
                Check Logs: ${BUILD_URL}

                Please review the error in the Jenkins console immediately.
                """,
                to: "bhautikv03@gmail.com"
            )
        }
    }
}

