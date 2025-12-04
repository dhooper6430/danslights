import requests
import csv
import time
import schedule
import gspread
import os
import logging
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file (robustly finding it in the script's dir)
script_dir = Path(__file__).parent
load_dotenv(dotenv_path=script_dir / '.env')

# --- Configuration ---
# Allow setting just the IP, or the full URL
DEVICE_IP = os.getenv("DEVICE_IP", "192.168.100.80")
DEFAULT_URL_TEMPLATE = "http://{ip}/turnip_data_log/data?format=csv&mark_discontinuities=0"

# Use DEVICE_URL if set, otherwise construct it from DEVICE_IP
DEVICE_URL = os.getenv("DEVICE_URL")
if not DEVICE_URL:
    DEVICE_URL = DEFAULT_URL_TEMPLATE.format(ip=DEVICE_IP)

SHEET_NAME = os.getenv("GOOGLE_SHEET_NAME", "DansLights Data")
CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials.json")
# Resolve relative paths for files to script directory
STATE_FILE = os.getenv("STATE_FILE", str(script_dir / "last_upload_state.txt"))
LOG_FILE = os.getenv("LOG_FILE", str(script_dir / "collector.log"))
COLLECTION_INTERVAL = int(os.getenv("COLLECTION_INTERVAL_MINUTES", 5))

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)

def get_last_recorded_timestamp():
    """Reads the last uploaded timestamp from a local file."""
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f:
            try:
                return float(f.read().strip())
            except ValueError:
                return 0
    return 0

def save_last_recorded_timestamp(ts):
    """Saves the latest timestamp to a local file."""
    with open(STATE_FILE, "w") as f:
        f.write(str(ts))

def fetch_and_process_data():
    logging.info("Starting data collection cycle...")
    
    # 1. Connect to Google Sheets
    try:
        gc = gspread.service_account(filename=CREDENTIALS_FILE)
        sh = gc.open(SHEET_NAME)
        worksheet = sh.get_worksheet(0) # Opens the first tab
    except Exception as e:
        logging.error(f"Failed to connect to Google Sheets: {e}")
        return

    # 2. Fetch Data from Device
    try:
        response = requests.get(DEVICE_URL, timeout=10)
        response.raise_for_status()
        decoded_content = response.content.decode('utf-8')
    except Exception as e:
        logging.error(f"Failed to fetch data from device: {e}")
        return

    # 3. Parse CSV
    # Assuming device returns: timestamp, value, ... (NO HEADERS based on your previous info)
    # If it HAS headers, we might need next(reader)
    csv_reader = csv.reader(decoded_content.splitlines(), delimiter=',')
    
    new_rows = []
    last_ts = get_last_recorded_timestamp()
    max_ts_in_batch = last_ts

    for row in csv_reader:
        if not row: continue # Skip empty lines
        
        try:
            # Adjust indices if your CSV format is different!
            # Based on previous snippet: Col 0 = Unix Timestamp, Col 1 = Count
            ts_raw = float(row[0])
            count = int(row[1])
            
            # Optional: Col 2 = Date string, but we can generate it if needed
            # date_str = row[2] if len(row) > 2 else datetime.fromtimestamp(ts_raw).strftime('%Y-%m-%d %H:%M:%S')

            if ts_raw > last_ts:
                # This is a NEW row
                # We format it explicitly for the sheet
                # Note: Google Sheets expects a list of lists
                new_rows.append([ts_raw, count])
                
                if ts_raw > max_ts_in_batch:
                    max_ts_in_batch = ts_raw

        except (ValueError, IndexError) as e:
            logging.warning(f"Skipping malformed row: {row} - {e}")
            continue

    # 4. Upload to Google Sheets
    if new_rows:
        logging.info(f"Found {len(new_rows)} new rows. Uploading...")
        try:
            # append_rows is more efficient than append_row loop
            worksheet.append_rows(new_rows)
            logging.info("Upload successful.")
            
            # 5. Update State
            save_last_recorded_timestamp(max_ts_in_batch)
            
        except Exception as e:
            logging.error(f"Failed to write to Google Sheets: {e}")
    else:
        logging.info("No new data found.")

def main():
    logging.info("Collector Service Started.")
    
    # Run once immediately on startup
    fetch_and_process_data()

    # Schedule every X minutes
    schedule.every(COLLECTION_INTERVAL).minutes.do(fetch_and_process_data)

    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    main()
