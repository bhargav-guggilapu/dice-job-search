document.addEventListener("DOMContentLoaded", () => {
  const jobInput = document.getElementById("jobInput");
  const dateFilter = document.getElementById("dateFilter");
  const workSetting = document.getElementById("workSetting");
  const searchButton = document.getElementById("searchButton");
  const downloadButton = document.getElementById("downloadButton");
  const statusDiv = document.getElementById("status");
  const tableBody = document.querySelector("#jobTable tbody");
  const tableHeaders = document.querySelectorAll("#jobTable th");

  // List of companies to search for
  const companies = [
    "Deemsys Inc",
    "Cogent IBS, Inc",
    "Photon",
    "R4 IT Solutions Inc",
    "Valueprosite",
    "Unica Group, Inc",
    "Vrddhi Solutions LLC",
  ];

  const roles = [
    "Software Engineer",
    "Data Scientist",
    "DevOps Engineer",
    "AWS Cloud Engineer",
    "Java Developer",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "QA Engineer",
    "Business Analyst",
    "Scrum Master",
    "Cybersecurity Analyst",
  ];

  const popularRolesContainer = document.querySelector(".popular-roles");

  roles.forEach((role) => {
    const roleButton = document.createElement("span");
    roleButton.className = "role-button";
    roleButton.textContent = role;

    roleButton.addEventListener("click", () => {
      document.querySelector("#jobInput").value = role;
      searchJobs();
    });

    popularRolesContainer.appendChild(roleButton);
  });

  document.querySelectorAll(".role-button").forEach((button) => {
    button.addEventListener("click", () => {
      jobInput.value = button.textContent;
      searchJobs();
    });
  });

  let allJobs = [];
  let sortColumn = null;
  let sortDirection = "asc";

  searchButton.addEventListener("click", searchJobs);
  downloadButton.addEventListener("click", () =>
    downloadCSV(convertToCSV(allJobs))
  );

  tableHeaders.forEach((header, index) => {
    header.addEventListener("click", () => sortTableByColumn(index));
  });

  jobInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      searchJobs();
    }
  });

  searchJobsByCompanies();

  async function searchJobs() {
    const jobTitle = jobInput.value.trim();
    if (!jobTitle) {
      alert("Please enter a job title");
      return;
    }

    statusDiv.textContent = "Fetching jobs...";
    searchButton.disabled = true;
    tableBody.innerHTML = "";
    downloadButton.style.display = "none";

    try {
      allJobs = await fetchAllJobs(jobTitle);
      displayJobs(allJobs);
      statusDiv.textContent = `Found ${allJobs.length} jobs.`;
      downloadButton.style.display = "block";
    } catch (error) {
      console.error("Error:", error);
      statusDiv.textContent =
        "An error occurred while fetching jobs. Please try again.";
    } finally {
      searchButton.disabled = false;
    }
  }

  async function searchJobsByCompanies() {
    statusDiv.textContent = "Fetching jobs from companies...";
    searchButton.disabled = true;
    tableBody.innerHTML = "";
    downloadButton.style.display = "none";
    allJobs = [];

    try {
      let allJobs = [];

      for (const company of companies) {
        const jobs = await fetchJobsByCompany(company);
        allJobs = allJobs.concat(jobs);
      }

      displayJobs(allJobs);
      statusDiv.textContent = `Found ${allJobs.length} jobs from ${companies.length} companies.`;
      downloadButton.style.display = allJobs.length > 0 ? "block" : "none";
    } catch (error) {
      console.error("Error:", error);
      statusDiv.textContent =
        "An error occurred while fetching jobs. Please try again.";
    } finally {
      searchButton.disabled = false;
    }
  }

  async function fetchJobsByCompany(companyName) {
    let allJobs = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      statusDiv.textContent = `Fetching ${companyName} jobs (page ${page})...`;

      const url = `https://job-search-api.svc.dhigroupinc.com/v1/dice/jobs/search?q=${encodeURIComponent(
        companyName
      )}&countryCode2=US&radius=30&radiusUnit=mi&page=${page}&pageSize=100&facets=employmentType%7CpostedDate%7CworkFromHomeAvailability%7CworkplaceTypes%7CemployerType%7CeasyApply%7CisRemote%7CwillingToSponsor&filters.postedDate=${encodeURIComponent(
        dateFilter.value
      )}${
        workSetting.value == "All"
          ? ""
          : `&filters.workplaceTypes=${encodeURIComponent(workSetting.value)}`
      }&filters.employmentType=THIRD_PARTY&fields=id%7CjobId%7Cguid%7Csummary%7Ctitle%7CpostedDate%7CmodifiedDate%7CjobLocation.displayName%7CdetailsPageUrl%7Csalary%7CclientBrandId%7CcompanyPageUrl%7CcompanyLogoUrl%7CcompanyLogoUrlOptimized%7CpositionId%7CcompanyName%7CemploymentType%7CisHighlighted%7Cscore%7CeasyApply%7CemployerType%7CworkFromHomeAvailability%7CworkplaceTypes%7CisRemote%7Cdebug%7CjobMetadata%7CwillingToSponsor&culture=en&recommendations=true&interactionId=0&fj=true&includeRemote=true`;

      try {
        const response = await fetch(url, {
          method: "GET",
          mode: "cors",
          referrerPolicy: "no-referrer",
          headers: {
            accept: "application/json, text/plain, */*",
            "x-api-key": "1YAt0R9wBg4WfsF9VB2778F5CHLAPMVW3WAZcKd8",
          },
        });

        if (!response.ok) {
          throw new Error(`Network response was not ok for ${companyName}`);
        }

        const data = await response.json();

        // Filter jobs to only include those from the exact company we're looking for
        const companyJobs = data.data.filter((job) =>
          job.companyName.toLowerCase().includes(companyName.toLowerCase())
        );

        allJobs = allJobs.concat(companyJobs);

        if (data.meta && data.meta.pageCount > page) {
          page++;
        } else {
          hasMorePages = false;
        }
      } catch (error) {
        console.error(`Error fetching jobs for ${companyName}:`, error);
        hasMorePages = false;
      }
    }

    return allJobs;
  }

  async function fetchAllJobs(jobTitle) {
    let allJobs = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      statusDiv.textContent = `Fetching page ${page}...`;
      const url = `https://job-search-api.svc.dhigroupinc.com/v1/dice/jobs/search?q=${encodeURIComponent(
        jobTitle
      )}&countryCode2=US&radius=30&radiusUnit=mi&page=${page}&pageSize=100&facets=employmentType%7CpostedDate%7CworkFromHomeAvailability%7CworkplaceTypes%7CemployerType%7CeasyApply%7CisRemote%7CwillingToSponsor&filters.postedDate=${encodeURIComponent(
        dateFilter.value
      )}${
        workSetting.value == "All"
          ? ""
          : `&filters.workplaceTypes=${encodeURIComponent(workSetting.value)}`
      }&filters.employmentType=THIRD_PARTY&fields=id%7CjobId%7Cguid%7Csummary%7Ctitle%7CpostedDate%7CmodifiedDate%7CjobLocation.displayName%7CdetailsPageUrl%7Csalary%7CclientBrandId%7CcompanyPageUrl%7CcompanyLogoUrl%7CcompanyLogoUrlOptimized%7CpositionId%7CcompanyName%7CemploymentType%7CisHighlighted%7Cscore%7CeasyApply%7CemployerType%7CworkFromHomeAvailability%7CworkplaceTypes%7CisRemote%7Cdebug%7CjobMetadata%7CwillingToSponsor&culture=en&recommendations=true&interactionId=0&fj=true&includeRemote=true`;

      const response = await fetch(url, {
        method: "GET",
        mode: "cors",
        referrerPolicy: "no-referrer", // Prevent sending the referrer
        headers: {
          accept: "application/json, text/plain, */*",
          "x-api-key": "1YAt0R9wBg4WfsF9VB2778F5CHLAPMVW3WAZcKd8",
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      allJobs = allJobs.concat(data.data);

      if (data.meta && data.meta.pageCount > page) {
        page++;
      } else {
        hasMorePages = false;
      }
    }
    return allJobs;
  }

  function displayJobs(jobs) {
    tableBody.innerHTML = jobs
      .map(
        (job) => `
              <tr>
                  <td><a href="${job.detailsPageUrl}" target="_blank">${
          job.title
        }</a></td>
                  <td><a href="${job.companyPageUrl}" target="_blank">${
          job.companyName
        }</a></td>
                  <td>${
                    job.jobLocation ? job.jobLocation.displayName : "Remote"
                  }</td>
                  <td>${job.salary || "N/A"}</td>
                  <td>${new Date(job.postedDate).toLocaleDateString()}</td>
              </tr>
            `
      )
      .join("");
  }

  function convertToCSV(jobs) {
    const headers = [
      "Job Title",
      "Job URL",
      "Company",
      "Company URL",
      "Location",
      "Salary",
      "Posted Date",
    ];

    const rows = jobs.map((job) => [
      job.title,
      job.detailsPageUrl,
      job.companyName,
      job.companyPageUrl,
      job.jobLocation ? job.jobLocation.displayName : "Remote",
      job.salary || "N/A",
      new Date(job.postedDate).toLocaleDateString(),
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell || ""}"`).join(","))
      .join("\n");
  }

  function downloadCSV(csv) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${jobInput.value != "" ? jobInput.value.trim() : "companies"}_${
          dateFilter.value
        }_${workSetting.value}_jobs.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  function sortTableByColumn(columnIndex) {
    const header = tableHeaders[columnIndex];
    const isSameColumn = sortColumn === columnIndex;
    sortDirection = isSameColumn && sortDirection === "asc" ? "desc" : "asc";
    sortColumn = columnIndex;

    tableHeaders.forEach((th) => th.classList.remove("sort-asc", "sort-desc"));
    header.classList.add(`sort-${sortDirection}`);

    allJobs.sort((a, b) => {
      const aValue = getValueForColumn(a, columnIndex);
      const bValue = getValueForColumn(b, columnIndex);

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    displayJobs(allJobs);
  }

  function getValueForColumn(job, columnIndex) {
    switch (columnIndex) {
      case 0:
        return job.title.toLowerCase();
      case 1:
        return job.companyName.toLowerCase();
      case 2:
        return job.jobLocation ? job.jobLocation.displayName.toLowerCase() : "";
      case 3:
        return job.salary || "";
      case 4:
        return new Date(job.postedDate).toLocaleDateString();
      default:
        return "";
    }
  }
});
