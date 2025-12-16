const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

app.get("/", (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BMI Calculator</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div class="container">
        <div class="calculator-card">
            <h1>BMI Calculator</h1>
            <p class="subtitle">Calculate your Body Mass Index</p>

            <form id="bmiForm" action="/calculate-bmi" method="POST">
                <div class="form-group">
                    <label for="weight">Weight (kg)</label>
                    <input
                        type="number"
                        id="weight"
                        name="weight"
                        placeholder="Enter your weight in kg"
                        step="0.1"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="height">Height (m)</label>
                    <input
                        type="number"
                        id="height"
                        name="height"
                        placeholder="Enter your height in meters"
                        step="0.01"
                        required
                    >
                </div>

                <button type="submit" class="btn-calculate">Calculate BMI</button>
            </form>

            <div class="info-section">
                <h3>BMI Categories:</h3>
                <ul>
                    <li><span class="category underweight">Underweight:</span> BMI &lt; 18.5</li>
                    <li><span class="category normal">Normal weight:</span> 18.5 ≤ BMI &lt; 24.9</li>
                    <li><span class="category overweight">Overweight:</span> 25 ≤ BMI &lt; 29.9</li>
                    <li><span class="category obese">Obese:</span> BMI ≥ 30</li>
                </ul>
            </div>
        </div>
    </div>

    <script>
        // Client-side validation
        document.getElementById('bmiForm').addEventListener('submit', function(e) {
            const weight = parseFloat(document.getElementById('weight').value);
            const height = parseFloat(document.getElementById('height').value);

            if (weight <= 0 || height <= 0) {
                e.preventDefault();
                alert('Please enter positive numbers for weight and height!');
                return false;
            }

            if (height > 3) {
                e.preventDefault();
                alert('Height seems too large. Please enter height in meters (e.g., 1.75 for 175cm)');
                return false;
            }

            if (weight > 500) {
                e.preventDefault();
                alert('Weight seems unrealistic. Please check your input.');
                return false;
            }
        });
    </script>
</body>
</html>
  `;

  res.send(html);
});

app.post("/calculate-bmi", (req, res) => {
  const { weight, height } = req.body;

  const weightNum = parseFloat(weight);
  const heightNum = parseFloat(height);

  if (isNaN(weightNum) || isNaN(heightNum)) {
    return res
      .status(400)
      .send(generateErrorPage("Invalid input. Please enter valid numbers."));
  }

  if (weightNum <= 0 || heightNum <= 0) {
    return res
      .status(400)
      .send(generateErrorPage("Weight and height must be positive numbers."));
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

  const resultHtml = generateResultPage(
    bmiRounded,
    category,
    categoryClass,
    healthAdvice,
    weightNum,
    heightNum,
  );
  res.send(resultHtml);
});

function generateErrorPage(errorMessage) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error - BMI Calculator</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div class="container">
        <div class="calculator-card">
            <h1>Error</h1>
            <div class="error-message">
                <p>${errorMessage}</p>
            </div>
            <a href="/" class="btn-calculate">Go Back</a>
        </div>
    </div>
</body>
</html>
  `;
}

function generateResultPage(
  bmi,
  category,
  categoryClass,
  healthAdvice,
  weight,
  height,
) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BMI Result</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div class="container">
        <div class="calculator-card">
            <h1>Your BMI Result</h1>

            <div class="result-display">
                <div class="bmi-value ${categoryClass}">
                    ${bmi}
                </div>
                <div class="bmi-category ${categoryClass}">
                    ${category}
                </div>
            </div>

            <div class="input-summary">
                <p><strong>Weight:</strong> ${weight} kg</p>
                <p><strong>Height:</strong> ${height} m</p>
            </div>

            <div class="health-advice">
                <h3>Health Advice:</h3>
                <p>${healthAdvice}</p>
            </div>

            <div class="info-section">
                <h3>BMI Categories:</h3>
                <ul>
                    <li><span class="category underweight">Underweight:</span> BMI &lt; 18.5</li>
                    <li><span class="category normal">Normal weight:</span> 18.5 ≤ BMI &lt; 24.9</li>
                    <li><span class="category overweight">Overweight:</span> 25 ≤ BMI &lt; 29.9</li>
                    <li><span class="category obese">Obese:</span> BMI ≥ 30</li>
                </ul>
            </div>

            <a href="/" class="btn-calculate">Calculate Again</a>
        </div>
    </div>
</body>
</html>
  `;
}

app.listen(PORT, () => {
  console.log(`BMI Calculator server is running on http://localhost:${PORT}`);
});
