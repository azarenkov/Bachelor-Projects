terraform {
  required_version = ">= 1.5.0"

  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

variable "docker_host" {
  type        = string
  default     = ""
  description = "Override DOCKER_HOST (e.g. unix:///Users/<you>/.orbstack/run/docker.sock for OrbStack). Empty = autodetect."
}

provider "docker" {
  host = var.docker_host != "" ? var.docker_host : null
}

variable "container_name" {
  type    = string
  default = "iac-web-server"
}

variable "host_http_port" {
  type    = number
  default = 8088
}

variable "image_tag" {
  type    = string
  default = "iac-web-base:1.0"
}

resource "docker_image" "web_base" {
  name = var.image_tag

  build {
    context    = path.module
    dockerfile = "Dockerfile"
    tag        = [var.image_tag]
  }

  keep_locally = false

  triggers = {
    dockerfile_sha = filesha256("${path.module}/Dockerfile")
  }
}

resource "docker_container" "web_server" {
  name  = var.container_name
  image = docker_image.web_base.image_id

  hostname = var.container_name
  restart  = "unless-stopped"

  ports {
    internal = 80
    external = var.host_http_port
  }

  labels {
    label = "managed-by"
    value = "terraform"
  }

  labels {
    label = "assignment"
    value = "sre-assignment-5"
  }
}

output "container_name" {
  value       = docker_container.web_server.name
  description = "Docker container name (use this in Ansible inventory)"
}

output "container_id" {
  value       = docker_container.web_server.id
  description = "Docker container ID"
}

output "web_url" {
  value       = "http://localhost:${var.host_http_port}"
  description = "URL where the configured web server will be reachable"
}
