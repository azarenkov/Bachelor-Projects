output "container_name" {
  description = "The name of the running container"
  value       = docker_container.nginx_container.name
}

output "container_image" {
  description = "The image used by the container"
  value       = docker_image.nginx.name
}

output "application_url" {
  description = "URL to access Nginx in the browser"
  value       = "http://localhost:${var.external_port}"
}