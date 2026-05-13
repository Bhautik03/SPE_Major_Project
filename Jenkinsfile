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
                        // Manual parsing - no plugin needed
                        def fileContent = readFile(ENV_FILE)
                        fileContent.split('\n').each { line ->
                            line = line.trim()
                            if (line && !line.startsWith('#') && line.contains('=')) {
                                def parts = line.split('=', 2)
                                env[parts[0].trim()] = parts[1].trim()
                            }
                        }

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
                    sh """
                        docker build -t ${env.IMAGE_AUTH}:${env.TAG} ./auth-service
                        docker tag  ${env.IMAGE_AUTH}:${env.TAG} ${env.IMAGE_AUTH}:latest
                    """
                    sh """
                        docker build -t ${env.IMAGE_PATIENT}:${env.TAG} ./patient-service
                        docker tag  ${env.IMAGE_PATIENT}:${env.TAG} ${env.IMAGE_PATIENT}:latest
                    """
                    sh """
                        docker build -t ${env.IMAGE_FRONTEND}:${env.TAG} ./frontend
                        docker tag  ${env.IMAGE_FRONTEND}:${env.TAG} ${env.IMAGE_FRONTEND}:latest
                    """
                }
            }
        }

        stage('Trivy Security Scan') {
            steps {
                script {
                    echo "Running Trivy vulnerability scan on all images..."
                    ["${env.IMAGE_AUTH}", "${env.IMAGE_PATIENT}", "${env.IMAGE_FRONTEND}"].each { img ->
                        sh """
                            docker run --rm \
                                -v /var/run/docker.sock:/var/run/docker.sock \
                                aquasec/trivy:latest image \
                                --severity CRITICAL,HIGH \
                                --no-progress \
                                --exit-code 0 \
                                ${img}:${env.TAG}
                        """
                    }
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
                        ["${env.IMAGE_AUTH}", "${env.IMAGE_PATIENT}", "${env.IMAGE_FRONTEND}"].each { img ->
                            retry(3) { sh "docker push ${img}:${env.TAG}" }
                            retry(3) { sh "docker push ${img}:latest" }
                        }
                    }
                }
            }
        }

        stage('Cleanup Old Images') {
            steps {
                script {
                    echo "Removing old image tags from Jenkins host..."
                    ["${env.IMAGE_AUTH}", "${env.IMAGE_PATIENT}", "${env.IMAGE_FRONTEND}"].each { img ->
                        sh """
                            docker images "${img}" --format "{{.Repository}}:{{.Tag}}" \
                                | grep -v "${env.TAG}" | grep -v "latest" | xargs -r docker rmi -f || true
                        """
                    }
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
