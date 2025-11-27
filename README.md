# Dan's Christmas Lights - Visitor Analytics

Welcome to Dan's Christmas Lights, a live visitor tracking project showcasing real-time crowd analytics from our holiday display.

This project combines:
*   **Live Visitor Data:** Detecting anonymous mobile device signals to estimate crowd size.
*   **Visualizations:** Custom Chart.js dashboards powered by Google Sheets data.
*   **Web Hosting:** Hosted freely and openly on GitHub Pages.

Visit the live site to see current activity: [https://danslights.com](https://danslights.com)

## Project Structure

*   `docs/`: The public-facing website code (HTML/CSS/JS) for GitHub Pages.
*   `device/`: The Python script responsible for collecting data from the Baldrick Signals Board and pushing it to Google Sheets.

### Device Setup

1.  **Google Cloud Credentials:**
    *   Create a Google Cloud Project, enable the Google Sheets API, and create a Service Account. You can find detailed instructions [here](https://gspread.readthedocs.io/en/latest/oauth2.html#for-bots-applications).
    *   Download the JSON key file for your Service Account and rename it to `credentials.json`. Place this file inside the `device/` folder.
    *   **Crucial:** Share your Google Sheet (giving **Editor** access) with the email address found in your `credentials.json` file (it looks like `your-service-account-id@project-id.iam.gserviceaccount.com`).
2.  **Python Virtual Environment:**
    *   Navigate to the `device/` directory: `cd device`
    *   Create a Python virtual environment: `python3 -m venv venv`
    *   Activate the virtual environment: 
        *   Linux/macOS: `source venv/bin/activate`
        *   Windows PowerShell: `.\venv\Scripts\activate`
3.  **Install Dependencies:**
    *   With the virtual environment activated: `pip install -r requirements.txt`
4.  **Run the Collector:**
    *   With the virtual environment activated: `python collect.py`
    *   The script will log its activity to `collector.log` in the same directory.
    *   To run it continuously (e.g., on a Raspberry Pi), consider using `nohup python collect.py &` or a process manager like `systemd` or `supervisord`.
