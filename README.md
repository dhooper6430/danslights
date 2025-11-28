# Dan's Christmas Lights - Visitor Analytics

Welcome to Dan's Christmas Lights, a live visitor tracking project showcasing real-time crowd analytics from our holiday display.

This project combines:
*   **Live Visitor Data:** Detecting anonymous mobile device signals to estimate crowd size.
*   **Visualizations:** Custom Chart.js dashboards powered by Google Sheets data.
*   **Web Hosting:** Hosted freely and openly on GitHub Pages.

Visit the live site to see current activity: [https://danslights.com](https://danslights.com)

## Project Structure

*   `docs/`: The public-facing website code (HTML/CSS/JS) for GitHub Pages.
*   `device/`: The Python collector script. It polls the sensor device and uploads data to Google Sheets.

---

## Device Collector Setup

This section describes how to set up the data collector on a Raspberry Pi or similar Linux device.

### 1. Prerequisites
*   A Raspberry Pi (or any Linux server/computer) with Python 3.7+.
*   Network access to the sensor device (default IP: `192.168.100.80`).
*   A Google Cloud Service Account with Google Sheets API enabled.

### 2. Installation

Clone the repository and set up the Python environment:

```bash
# Clone the repo
git clone https://github.com/dhooper6430/dans-lights.git
cd dans-lights/device

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configuration

#### Environment Variables
Copy the example configuration file and edit it:

```bash
cp .env.example .env
nano .env
```
Update `DEVICE_URL`, `GOOGLE_SHEET_NAME`, and other settings in `.env` as needed.

#### Google Sheets Credentials
1.  Create a Google Cloud Project and enable the **Google Sheets API**.
2.  Create a **Service Account** and download the JSON key file.
3.  Rename the file to `credentials.json` and place it in the `device/` folder.
4.  **Crucial:** Open your Google Sheet in the browser and **Share** it with the `client_email` address found inside `credentials.json` (give "Editor" access).

### 4. Running the Collector

**Manual Run (for testing):**
```bash
source venv/bin/activate
python collect.py
```

**Automatic Background Service (Systemd):**
To have the collector start automatically at boot (recommended for Raspberry Pi):

1.  Edit `lights-collector.service` and ensure the paths and user (`User=dhooper`) match your setup.
2.  Install the service:
    ```bash
    sudo cp lights-collector.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable lights-collector
    sudo systemctl start lights-collector
    ```
3.  Check logs:
    ```bash
    journalctl -u lights-collector -f
    ```

---

## Website Development

The `docs/` folder contains the source for the GitHub Pages site.

*   **`index.html`**: Main dashboard entry point.
*   **`js/main.js`**: Fetches data from the published Google Sheet (via CSV export link) and renders the charts.