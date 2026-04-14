variable "container_name" {
  description = "Name of the Docker container"
  type        = string
  default     = "terraform-nginx"
}

variable "external_port" {
  description = "Port exposed on the host machine"
  type        = number
  default     = 8080
}
