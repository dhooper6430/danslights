# Dan's Christmas Lights - Visitor Analytics

Welcome to Dan's Christmas Lights, a live visitor tracking project showcasing real-time crowd analytics from our holiday display.

This project combines:
*   **Live Visitor Data:** Detecting anonymous mobile device signals to estimate crowd size.
*   **Visualizations:** Custom Chart.js dashboards powered by Google Sheets data.
*   **Web Hosting:** Hosted freely and openly on GitHub Pages.

Visit the live site to see current activity: [https://danslights.com](https://danslights.com)

## Project Structure

*   `docs/`: The public-facing website code (HTML/CSS/JS) for GitHub Pages.
*   `signals-collector/`: The Python collector script for the Baldrick Signals Board. It polls the device and uploads data to Google Sheets.

---

## Signals Collector Setup

This section describes how to set up the `signals-collector` on a Raspberry Pi or similar Linux device to interface with the Baldrick Signals Board.

### 1. Prerequisites
*   A Raspberry Pi (or any Linux server/computer) with Python 3.7+.
*   Network access to the Baldrick Signals Board (default IP: `192.168.100.80`).
*   A Google Cloud Service Account with Google Sheets API enabled.

### 2. Quick Installation (Automated)

We provide a helper script to set up the environment, dependencies, and background service automatically.

```bash
# Clone the repo
git clone https://github.com/dhooper6430/danslights.git
cd danslights/signals-collector

# Make the installer executable and run it
chmod +x install.sh
./install.sh
```

The script will:
*   Create a Python virtual environment (`venv`).
*   Install required Python packages.
*   Create a default `.env` configuration file.
*   Generate and install the `signals-collector` systemd service for your user.

### 3. Configuration

After running the installer, you must configure the collector:

1.  **Google Credentials:** Place your Google Service Account JSON key file in the `signals-collector/` folder and name it `credentials.json`.
2.  **Environment Variables:** Edit the newly created `.env` file:
    ```bash
    nano .env
    ```
    *   Update `DEVICE_IP` (default: 192.168.100.80).
    *   Update `GOOGLE_SHEET_NAME` if your target sheet has a different name.
3.  **Share Sheet:** Open your Google Sheet in the browser and **Share** it with the `client_email` address found inside your `credentials.json` (give "Editor" access).

### 4. Start the Service

Once configured, start the background service:

```bash
sudo systemctl start signals-collector
```

**Useful Commands:**
*   **Check Status:** `sudo systemctl status signals-collector`
*   **View Logs:** `journalctl -u signals-collector -f`
*   **Stop Service:** `sudo systemctl stop signals-collector`

---

## Website Development

The `docs/` folder contains the source for the GitHub Pages site.

*   **`index.html`**: Main dashboard entry point.
*   **`js/main.js`**: Fetches data from the published Google Sheet (via CSV export link) and renders the charts.