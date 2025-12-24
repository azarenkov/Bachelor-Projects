const generateBtn = document.getElementById("generateBtn");
const content = document.getElementById("content");
const errorMessage = document.getElementById("errorMessage");
const loader = document.querySelector(".loader");
const btnText = document.querySelector(".btn-text");

generateBtn.addEventListener("click", generateRandomUser);

function setLoading(isLoading) {
  if (isLoading) {
    loader.style.display = "inline-block";
    btnText.textContent = "Loading...";
    generateBtn.disabled = true;
  } else {
    loader.style.display = "none";
    btnText.textContent = "Generate Random User";
    generateBtn.disabled = false;
  }
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
  content.style.display = "none";

  setTimeout(() => {
    errorMessage.style.display = "none";
  }, 5000);
}

function hideError() {
  errorMessage.style.display = "none";
}

async function generateRandomUser() {
  setLoading(true);
  hideError();

  try {
    const response = await fetch("/api/random-user-data");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    displayUserProfile(data.user);
    displayCountryInfo(data.country);
    displayExchangeRates(data.exchangeRates);
    displayNews(data.news);

    content.style.display = "block";
  } catch (error) {
    console.error("Error fetching data:", error);
    showError("Failed to fetch user data. Please try again.");
  } finally {
    setLoading(false);
  }
}

function displayUserProfile(user) {
  document.getElementById("profilePicture").src = user.profilePicture;
  document.getElementById("fullName").textContent =
    `${user.firstName} ${user.lastName}`;
  document.getElementById("gender").textContent =
    user.gender.charAt(0).toUpperCase() + user.gender.slice(1);
  document.getElementById("age").textContent = `${user.age} years old`;
  document.getElementById("dob").textContent = user.dateOfBirth;
  document.getElementById("city").textContent = user.city;
  document.getElementById("country").textContent = user.country;
  document.getElementById("address").textContent = user.fullAddress;
}

function displayCountryInfo(country) {
  if (country) {
    document.getElementById("countryFlag").src = country.flag;
    document.getElementById("capital").textContent = country.capital;
    document.getElementById("languages").textContent = country.languages;
    document.getElementById("currency").textContent = country.currency;
  }
}

function displayExchangeRates(rates) {
  const exchangeSection = document.getElementById("exchangeSection");

  if (rates && rates.formatted) {
    document.getElementById("exchangeUSD").textContent = rates.formatted.usd;
    document.getElementById("exchangeKZT").textContent = rates.formatted.kzt;
    exchangeSection.style.display = "block";
  } else {
    exchangeSection.style.display = "none";
  }
}

function displayNews(news) {
  const newsSection = document.getElementById("newsSection");
  const newsContainer = document.getElementById("newsContainer");

  if (news && news.length > 0) {
    newsContainer.innerHTML = "";

    news.forEach((article) => {
      const newsCard = document.createElement("div");
      newsCard.className = "news-card card";

      const imageHtml = article.image
        ? `<img src="${article.image}" alt="${article.title}" class="news-image" onerror="this.style.display='none'">`
        : "";

      newsCard.innerHTML = `
                ${imageHtml}
                <div class="news-content">
                    <h3 class="news-title">${article.title}</h3>
                    <p class="news-description">${article.description}</p>
                    <div class="news-meta">
                        <span class="news-source">${article.source}</span>
                        <span class="news-date">${article.publishedAt}</span>
                    </div>
                    <a href="${article.sourceUrl}" target="_blank" rel="noopener noreferrer" class="news-link">
                        Read Full Article →
                    </a>
                </div>
            `;

      newsContainer.appendChild(newsCard);
    });

    newsSection.style.display = "block";
  } else {
    newsSection.style.display = "none";
  }
}
