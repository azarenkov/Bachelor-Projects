const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

function readTemplate(filename, replacements = {}) {
  let html = fs.readFileSync(path.join(__dirname, "views", filename), "utf-8");

  Object.keys(replacements).forEach((key) => {
    const placeholder = `{{${key}}}`;
    html = html.replace(new RegExp(placeholder, "g"), replacements[key]);
  });

  return html;
}

app.get("/", (req, res) => {
  const html = readTemplate("index.html");
  res.send(html);
});

app.post("/calculate-bmi", (req, res) => {
  const { weight, height } = req.body;

  const weightNum = parseFloat(weight);
  const heightNum = parseFloat(height);

  if (isNaN(weightNum) || isNaN(heightNum)) {
    const html = readTemplate("error.html", {
      errorMessage: "Invalid input. Please enter valid numbers.",
    });
    return res.status(400).send(html);
  }

  if (weightNum <= 0 || heightNum <= 0) {
    const html = readTemplate("error.html", {
      errorMessage: "Weight and height must be positive numbers.",
    });
    return res.status(400).send(html);
  }

  const bmi = weightNum / (heightNum * heightNum);
  const bmiRounded = bmi.toFixed(1);

  let category = "";
  let categoryClass = "";
  let healthAdvice = "";

  if (bmi < 18.5) {
    category = "Underweight";
    categoryClass = "underweight";
    healthAdvice =
      "You may need to gain weight. Consult with a healthcare provider for personalized advice.";
  } else if (bmi >= 18.5 && bmi < 24.9) {
    category = "Normal weight";
    categoryClass = "normal";
    healthAdvice =
      "Great! You have a healthy weight. Keep maintaining your current lifestyle.";
  } else if (bmi >= 25 && bmi < 29.9) {
    category = "Overweight";
    categoryClass = "overweight";
    healthAdvice =
      "Consider adopting a healthier diet and exercise routine to reach a normal weight.";
  } else {
    category = "Obese";
    categoryClass = "obese";
    healthAdvice =
      "It's recommended to consult with a healthcare provider for a personalized weight management plan.";
  }

  const html = readTemplate("result.html", {
    bmi: bmiRounded,
    category: category,
    categoryClass: categoryClass,
    healthAdvice: healthAdvice,
    weight: weightNum,
    height: heightNum,
  });

  res.send(html);
});

app.listen(PORT, () => {
  console.log(`BMI Calculator server is running on http://localhost:${PORT}`);
});
