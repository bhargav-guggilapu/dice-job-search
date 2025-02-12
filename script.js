document.addEventListener("DOMContentLoaded", () => {
  const jobInput = document.getElementById("jobInput");
  const searchButton = document.getElementById("searchButton");
  const downloadButton = document.getElementById("downloadButton");
  const statusDiv = document.getElementById("status");
  const tableBody = document.querySelector("#jobTable tbody");

  let allJobs = [];

  searchButton.addEventListener("click", searchJobs);
  downloadButton.addEventListener("click", () =>
    downloadCSV(convertToCSV(allJobs))
  );

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

  async function fetchAllJobs(jobTitle) {
    let allJobs = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      statusDiv.textContent = `Fetching page ${page}...`;
      const url = `https://job-search-api.svc.dhigroupinc.com/v1/dice/jobs/search?q=${encodeURIComponent(
        jobTitle
      )}&countryCode2=US&radius=30&radiusUnit=mi&page=${page}&pageSize=100&facets=employmentType%7CpostedDate%7CworkFromHomeAvailability%7CworkplaceTypes%7CemployerType%7CeasyApply%7CisRemote%7CwillingToSponsor&filters.workplaceTypes=On-Site%7CHybrid%7CRemote&filters.employmentType=THIRD_PARTY&filters.postedDate=SEVEN&fields=id%7CjobId%7Cguid%7Csummary%7Ctitle%7CpostedDate%7CmodifiedDate%7CjobLocation.displayName%7CdetailsPageUrl%7Csalary%7CclientBrandId%7CcompanyPageUrl%7CcompanyLogoUrl%7CcompanyLogoUrlOptimized%7CpositionId%7CcompanyName%7CemploymentType%7CisHighlighted%7Cscore%7CeasyApply%7CemployerType%7CworkFromHomeAvailability%7CworkplaceTypes%7CisRemote%7Cdebug%7CjobMetadata%7CwillingToSponsor&culture=en&recommendations=true&interactionId=0&fj=true&includeRemote=true`;

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
      link.setAttribute("download", `${jobInput.value.trim()}_jobs.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
});
