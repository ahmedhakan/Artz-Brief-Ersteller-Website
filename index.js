const express = require("express");
const fs = require("fs");
const { TemplateHandler } = require("easy-template-x");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve static files from the public directory
app.use(express.static("public"));

// Route for root path
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html")); // Serve index.html
});

app.post("/generate-letter", async (req, res) => {
  const data = req.body;

  // Ensure invoiceDate is in YYYY-MM-DD format
  if (!isValidDate(data.invoiceDate)) {
    data.invoiceDate = getCurrentDate(); // Default to current date if invalid
  }

  // Format date for display in German
  data.invoiceDate = new Date(data.invoiceDate).toLocaleDateString(
    "de-DE",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" }
  );

  // Format patientBirthDate and deathDate
  if (data.patientBirthDate) {
    data.patientBirthDate = formatDate(new Date(data.patientBirthDate));
  }
  if (data.deathDate) {
    data.deathDate = formatDate(new Date(data.deathDate));
  }

  // Select the appropriate template based on the letter type
  let templateFile;
  if (data.letterType === "L") {
    templateFile = path.join(__dirname, "templates", "myTemplate2.docx");
  } else if (data.letterType === "Ä") {
    templateFile = path.join(__dirname, "templates", "myTemplateBehandlung2.docx");
  } else {
    // Handle invalid letter type (optional)
    return res.status(400).json({ error: "Invalid letter type" });
  }

  // Read template file
  const templateFileContent = fs.readFileSync(templateFile);

  // Convert the template file to a buffer
  const templateBuffer = Buffer.from(templateFileContent);

  // Process the template
  const handler = new TemplateHandler();
  const doc = await handler.process(templateBuffer, data);

  // Generate filename with patient's name
  const patientName = data.patientName.replace(/\s/g, "_"); // Replace spaces with underscores
  const filename = `${patientName}_Artz.docx`;

  // Send output
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="' + filename + '"'
  ); // Use template literal for correct filename
  res.send(doc);
});


// Function to check if a date string is valid in YYYY-MM-DD format
function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(dateString);
}

// Function to get current date in YYYY-MM-DD format
function getCurrentDate() {
  const currentDate = new Date().toISOString().split("T")[0];
  return currentDate;
}

// Function to format date as DD.MM.YYYY
function formatDate(date) {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is 0-indexed
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});