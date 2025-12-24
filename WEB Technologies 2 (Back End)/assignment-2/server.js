const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

app.get("/api/random-user-data", async (req, res) => {
  try {
    console.log("Fetching random user...");
    const userResponse = await fetch("https://randomuser.me/api/");
    const userData = await userResponse.json();

    if (!userData.results || userData.results.length === 0) {
      throw new Error("No user data received");
    }

    const user = userData.results[0];

    const userInfo = {
      firstName: user.name.first,
      lastName: user.name.last,
      gender: user.gender,
      profilePicture: user.picture.large,
      age: user.dob.age,
      dateOfBirth: new Date(user.dob.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      city: user.location.city,
      country: user.location.country,
      fullAddress: `${user.location.street.number} ${user.location.street.name}`,
    };

    console.log(`User country: ${userInfo.country}`);

    console.log("Fetching country information...");
    const countryResponse = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(userInfo.country)}?fullText=false`,
    );
    const countryData = await countryResponse.json();

    let countryInfo = null;
    let currencyCode = null;

    if (countryData && countryData.length > 0) {
      const country = countryData[0];

      const languages = country.languages
        ? Object.values(country.languages).join(", ")
        : "N/A";

      const currencies = country.currencies
        ? Object.entries(country.currencies).map(([code, curr]) => ({
            code: code,
            name: curr.name,
            symbol: curr.symbol || "",
          }))
        : [];

      currencyCode = currencies.length > 0 ? currencies[0].code : null;

      countryInfo = {
        name: country.name.common,
        capital: country.capital ? country.capital[0] : "N/A",
        languages: languages,
        currency:
          currencies.length > 0
            ? `${currencies[0].name} (${currencies[0].code})${currencies[0].symbol ? " - " + currencies[0].symbol : ""}`
            : "N/A",
        flag: country.flags.svg || country.flags.png,
      };
    }

    let exchangeRates = null;
    if (currencyCode && process.env.EXCHANGE_RATE_API_KEY) {
      try {
        console.log(`Fetching exchange rates for ${currencyCode}...`);
        const exchangeResponse = await fetch(
          `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/latest/${currencyCode}`,
        );
        const exchangeData = await exchangeResponse.json();

        if (exchangeData.result === "success") {
          exchangeRates = {
            baseCurrency: currencyCode,
            usd: exchangeData.conversion_rates.USD,
            kzt: exchangeData.conversion_rates.KZT,
            formatted: {
              usd: `1 ${currencyCode} = ${exchangeData.conversion_rates.USD.toFixed(2)} USD`,
              kzt: `1 ${currencyCode} = ${exchangeData.conversion_rates.KZT.toFixed(2)} KZT`,
            },
          };
        }
      } catch (error) {
        console.error("Error fetching exchange rates:", error.message);
      }
    }

    let newsHeadlines = [];
    if (process.env.NEWS_API_KEY) {
      try {
        console.log(`Fetching news for ${userInfo.country}...`);
        const newsResponse = await fetch(
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(userInfo.country)}&language=en&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`,
        );
        const newsData = await newsResponse.json();

        if (newsData.status === "ok" && newsData.articles) {
          newsHeadlines = newsData.articles.slice(0, 5).map((article) => ({
            title: article.title,
            description: article.description || "No description available",
            image: article.urlToImage,
            sourceUrl: article.url,
            source: article.source.name,
            publishedAt: new Date(article.publishedAt).toLocaleDateString(
              "en-US",
              {
                year: "numeric",
                month: "short",
                day: "numeric",
              },
            ),
          }));
        }
      } catch (error) {
        console.error("Error fetching news:", error.message);
      }
    }

    const responseData = {
      user: userInfo,
      country: countryInfo,
      exchangeRates: exchangeRates,
      news: newsHeadlines,
      timestamp: new Date().toISOString(),
    };

    console.log("Successfully fetched all data");
    res.json(responseData);
  } catch (error) {
    console.error("Error in /api/random-user-data:", error);
    res.status(500).json({
      error: "Failed to fetch data",
      message: error.message,
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    apiKeysConfigured: {
      exchangeRate: !!process.env.EXCHANGE_RATE_API_KEY,
      news: !!process.env.NEWS_API_KEY,
    },
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log("API Keys status:");
  console.log(
    "  - Exchange Rate API:",
    process.env.EXCHANGE_RATE_API_KEY ? "Configured" : "Missing",
  );
  console.log(
    "  - News API:",
    process.env.NEWS_API_KEY ? "Configured" : "Missing",
  );
});
