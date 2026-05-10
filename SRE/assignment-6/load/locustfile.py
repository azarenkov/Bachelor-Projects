from locust import HttpUser, task, between


class ShopApiUser(HttpUser):
    wait_time = between(0.1, 0.5)

    @task(8)
    def hot_work(self):
        self.client.get("/work?iters=120000", name="/work (cpu burn)")

    @task(2)
    def index(self):
        self.client.get("/", name="/")
