pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
    }

    environment {
        TAG = "${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout Code') {
            steps {
                retry(3) { checkout scm }
            }
        }

        stage('Load Env') {
            steps {
                withCredentials([file(credentialsId: 'env-file', variable: 'ENV_FILE')]) {
                    script {
                        env.DOCKER_USER_REPO  = sh(script: "grep -m1 ^DOCKER_USER_REPO= \$ENV_FILE | cut -d= -f2-", returnStdout: true).trim()
                        env.DOCKER_CRED_ID    = sh(script: "grep -m1 ^DOCKER_CRED_ID= \$ENV_FILE | cut -d= -f2-", returnStdout: true).trim()
                        env.IMAGE_AUTH        = sh(script: "grep -m1 ^IMAGE_AUTH= \$ENV_FILE | cut -d= -f2-", returnStdout: true).trim()
                        env.IMAGE_PATIENT     = sh(script: "grep -m1 ^IMAGE_PATIENT= \$ENV_FILE | cut -d= -f2-", returnStdout: true).trim()
                        env.IMAGE_FRONTEND    = sh(script: "grep -m1 ^IMAGE_FRONTEND= \$ENV_FILE | cut -d= -f2-", returnStdout: true).trim()
                        env.JWT_SECRET        = sh(script: "grep -m1 ^JWT_SECRET= \$ENV_FILE | cut -d= -f2-", returnStdout: true).trim()
                        env.GOOGLE_CLIENT_ID  = sh(script: "grep -m1 ^GOOGLE_CLIENT_ID= \$ENV_FILE | cut -d= -f2-", returnStdout: true).trim()
                        env.NOTIFY_EMAIL      = sh(script: "grep -m1 ^NOTIFY_EMAIL= \$ENV_FILE | cut -d= -f2-", returnStdout: true).trim()

                        if (!env.DOCKER_USER_REPO) error "DOCKER_USER_REPO is missing from env-file"
                        if (!env.DOCKER_CRED_ID)   error "DOCKER_CRED_ID is missing from env-file"
                        if (!env.IMAGE_AUTH)        error "IMAGE_AUTH is missing from env-file"
                        if (!env.JWT_SECRET)        error "JWT_SECRET is missing from env-file"

                        echo "Docker User   : ${env.DOCKER_USER_REPO}"
                        echo "Auth Image    : ${env.IMAGE_AUTH}:${env.TAG}"
                        echo "Patient Image : ${env.IMAGE_PATIENT}:${env.TAG}"
                        echo "Frontend Image: ${env.IMAGE_FRONTEND}:${env.TAG}"
                    }
                }
            }
        }

        stage('Unit Tests') {
            steps {
                script {
                    echo "Running unit tests for all services..."
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
                    sh "docker build -t ${env.IMAGE_AUTH}:${env.TAG} ./auth-service"
                    sh "docker tag  ${env.IMAGE_AUTH}:${env.TAG} ${env.IMAGE_AUTH}:latest"
                    sh "docker inspect ${env.IMAGE_AUTH}:${env.TAG} > /dev/null || (echo 'AUTH image missing!' && exit 1)"

                    sh "docker build -t ${env.IMAGE_PATIENT}:${env.TAG} ./patient-service"
                    sh "docker tag  ${env.IMAGE_PATIENT}:${env.TAG} ${env.IMAGE_PATIENT}:latest"
                    sh "docker inspect ${env.IMAGE_PATIENT}:${env.TAG} > /dev/null || (echo 'PATIENT image missing!' && exit 1)"

                    sh "docker build -t ${env.IMAGE_FRONTEND}:${env.TAG} ./frontend"
                    sh "docker tag  ${env.IMAGE_FRONTEND}:${env.TAG} ${env.IMAGE_FRONTEND}:latest"
                    sh "docker inspect ${env.IMAGE_FRONTEND}:${env.TAG} > /dev/null || (echo 'FRONTEND image missing!' && exit 1)"

                    echo "All 3 images built successfully:"
                    sh "docker images | grep -E '${env.IMAGE_AUTH}|${env.IMAGE_PATIENT}|${env.IMAGE_FRONTEND}'"
                }
            }
        }

        stage('Trivy Security Scan') {
            steps {
                script {
                    echo "Running Trivy vulnerability scan on all images..."

                    // Save images to tar and scan via --input to avoid Docker socket namespace issues
                    sh """
                        docker save ${env.IMAGE_AUTH}:${env.TAG} -o /tmp/trivy-auth-${env.TAG}.tar
                        docker run --rm \
                            -v /tmp:/tmp \
                            aquasec/trivy:latest image \
                            --input /tmp/trivy-auth-${env.TAG}.tar \
                            --severity CRITICAL,HIGH \
                            --no-progress \
                            --exit-code 0 \
                            --timeout 10m
                        rm -f /tmp/trivy-auth-${env.TAG}.tar
                    """

                    sh """
                        docker save ${env.IMAGE_PATIENT}:${env.TAG} -o /tmp/trivy-patient-${env.TAG}.tar
                        docker run --rm \
                            -v /tmp:/tmp \
                            aquasec/trivy:latest image \
                            --input /tmp/trivy-patient-${env.TAG}.tar \
                            --severity CRITICAL,HIGH \
                            --no-progress \
                            --exit-code 0 \
                            --timeout 10m
                        rm -f /tmp/trivy-patient-${env.TAG}.tar
                    """

                    sh """
                        docker save ${env.IMAGE_FRONTEND}:${env.TAG} -o /tmp/trivy-frontend-${env.TAG}.tar
                        docker run --rm \
                            -v /tmp:/tmp \
                            aquasec/trivy:latest image \
                            --input /tmp/trivy-frontend-${env.TAG}.tar \
                            --severity CRITICAL,HIGH \
                            --no-progress \
                            --exit-code 0 \
                            --timeout 10m
                        rm -f /tmp/trivy-frontend-${env.TAG}.tar
                    """
                }
            }
        }

        stage('Push Docker Images') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${env.DOCKER_CRED_ID}",
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    script {
                        retry(3) {
                            sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                        }
                        retry(3) { sh "docker push ${env.IMAGE_AUTH}:${env.TAG}" }
                        retry(3) { sh "docker push ${env.IMAGE_AUTH}:latest" }
                        retry(3) { sh "docker push ${env.IMAGE_PATIENT}:${env.TAG}" }
                        retry(3) { sh "docker push ${env.IMAGE_PATIENT}:latest" }
                        retry(3) { sh "docker push ${env.IMAGE_FRONTEND}:${env.TAG}" }
                        retry(3) { sh "docker push ${env.IMAGE_FRONTEND}:latest" }
                    }
                }
            }
        }

        stage('Cleanup Old Images') {
            steps {
                script {
                    echo "Removing old image tags from Jenkins host..."
                    sh """
                        docker images "${env.IMAGE_AUTH}" --format "{{.Repository}}:{{.Tag}}" \
                            | grep -v "${env.TAG}" | grep -v "latest" | xargs -r docker rmi -f || true
                    """
                    sh """
                        docker images "${env.IMAGE_PATIENT}" --format "{{.Repository}}:{{.Tag}}" \
                            | grep -v "${env.TAG}" | grep -v "latest" | xargs -r docker rmi -f || true
                    """
                    sh """
                        docker images "${env.IMAGE_FRONTEND}" --format "{{.Repository}}:{{.Tag}}" \
                            | grep -v "${env.TAG}" | grep -v "latest" | xargs -r docker rmi -f || true
                    """
                }
            }
        }

        stage('Deploy via Ansible') {
            steps {
                script {
                    echo "Starting Ansible deployment..."
                    sh """
                        ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook -i ansible/inventory.ini ansible/deploy.yml \
                        -e "jwt_secret=${env.JWT_SECRET}" \
                        -e "google_client_id=${env.GOOGLE_CLIENT_ID}" \
                        -e "tag=${env.TAG}"
                    """
                }
            }
        }
    }

    post {
        success {
            emailext (
                subject: "SUCCESS: Build #${BUILD_NUMBER} - ${JOB_NAME}",
                body: "Build #${BUILD_NUMBER} completed successfully.",
                to: "${env.NOTIFY_EMAIL}"
            )
        }
        failure {
            emailext (
                subject: "FAILED: Build #${BUILD_NUMBER} - ${JOB_NAME}",
                body: "Build #${BUILD_NUMBER} failed. Check logs: ${BUILD_URL}",
                to: "${env.NOTIFY_EMAIL}"
            )
        }
    }
}
