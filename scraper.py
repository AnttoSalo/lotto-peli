from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import datetime

# Helper function to calculate the end date of an 11-week range
target_end_date = datetime.date(1990, 1, 1)
def calculate_end_date(start_date):
    return start_date + datetime.timedelta(weeks=10)

# Helper function to get Finnish weekday abbreviation
def get_finnish_weekday(date):
    weekdays = ["ma", "ti", "ke", "to", "pe", "la", "su"]  # Monday to Sunday
    return weekdays[date.weekday()]

def get_finnish_month_name(date):
    months = [
        "tammik.", "helmik.", "maalisk.", "huhtik.", "toukok.", "kesäk.",
        "heinäk.", "elok.", "syysk.", "lokak.", "marrask.", "jouluk."
    ]
    return months[date.month - 1]

def get_finnish_full_month_name(date):
    full_months = [
        "tammikuu", "helmikuu", "maaliskuu", "huhtikuu", "toukokuu", "kesäkuu",
        "heinäkuu", "elokuu", "syyskuu", "lokakuu", "marraskuu", "joulukuu"
    ]
    return full_months[date.month - 1]

# Setup the browser
driver = webdriver.Chrome()
driver.get("https://www.veikkaus.fi/fi/tulokset#!/tarkennettu-haku/lotto")
driver.implicitly_wait(0.5)

# Accept cookies
try:
    accept_cookies_button = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.ID, "save-all-action"))
    )
    accept_cookies_button.click()
    print("Cookies accepted.")
except Exception as e:
    print(f"Error accepting cookies: {e}")

def get_lotto(start_date, end_date, lotto_results, forward = True):
    # Locate the parent container for date pickers
    date_picker_container = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, "search-range"))
    )

    # Open the calendar for the start date
    calendar_buttons = date_picker_container.find_elements(By.CLASS_NAME, "DateInput-module__calendarButton--BQVLC")
    calendar_buttons[0].click()

    # Navigate to the correct month for the start date
    while True:
        caption = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "DatePickerBase-module__caption_label--lD0hz"))
        ).text
        if get_finnish_full_month_name(start_date) in caption.lower() and str(start_date.year) in caption.lower():
            break
        if forward:
            next_button = driver.find_element(By.CSS_SELECTOR, ".Header-module__navButton--QvGis[aria-label='Seuraava kuukausi']")
            next_button.click()
        else:
            previous_button = driver.find_element(By.CSS_SELECTOR, ".Header-module__navButton--QvGis[aria-label='Edellinen kuukausi']")
            previous_button.click()

    # Select the start date
    start_weekday = get_finnish_weekday(start_date)
    start_month = get_finnish_month_name(start_date)
    start_date_element = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, f"//button[@aria-label='{start_weekday} {start_date.day}. {start_month} {start_date.year}']"))
    )
    start_date_element.click()

    # Open the calendar for the end date
    calendar_buttons[1].click()
    # Debugging: Print all available aria-labels for the end date selection
    # Debugging: Print all available aria-labels for the end date selection
    calendar_days = driver.find_elements(By.XPATH, "//button[contains(@aria-label, '')]")
    print("Available dates in the calendar for end date:")
    for day in calendar_days:
        print(day.get_attribute("aria-label"))


    while True:
        caption = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "DatePickerBase-module__caption_label--lD0hz"))
        ).text
        if get_finnish_full_month_name(end_date) in caption.lower() and str(end_date.year) in caption.lower():
            break
        if forward:
            next_button = driver.find_element(By.CSS_SELECTOR, ".Header-module__navButton--QvGis[aria-label='Seuraava kuukausi']")
            next_button.click()
        else:
            previous_button = driver.find_element(By.CSS_SELECTOR, ".Header-module__navButton--QvGis[aria-label='Edellinen kuukausi']")
            previous_button.click()
        
    import time
    from selenium.common.exceptions import StaleElementReferenceException

    try:
        end_weekday = get_finnish_weekday(end_date)
        end_month = get_finnish_month_name(end_date)
        end_date_label = f"{end_weekday} {end_date.day}. {end_month} {end_date.year}"
        print(f"Attempting to find and click: {end_date_label}")

        # XPath to locate the end date button
        xpath = f"//button[contains(@aria-label, '{end_weekday} {end_date.day}.') and contains(@aria-label, '{end_month}')]"
        
        # Retry logic for stale element exceptions
        for attempt in range(3):  # Try up to 3 times
            try:
                end_date_element = WebDriverWait(driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, xpath))
                )
                end_date_element.click()
                print("End date clicked successfully.")
                break
            except StaleElementReferenceException as e:
                print(f"Attempt {attempt + 1}: Element became stale. Retrying...")
                time.sleep(1)  # Small delay before retry
        else:
            raise Exception("Failed to click end date after multiple attempts.")
        
        # Allow time for UI to update
        time.sleep(2)

        selected_date = end_date_element.get_attribute("aria-label")
        print(f"Selected date: {selected_date}")

        if selected_date != end_date_label:
            print("End date selection verification failed.")
        else:
            print("End date selection verified.")
    except Exception as e:
        print(f"Error selecting end date: {e}")


    # Confirm the selected date range
    print(f"Start Date Selected: {start_date.strftime('%d.%m.%Y')}")
    print(f"End Date Selected: {end_date.strftime('%d.%m.%Y')}")

    # Click search button
    result_button = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.ID, "nav__date-search"))
    )
    result_button.click()

    # Wait for results
    primary_nums_elements = WebDriverWait(driver, 10).until(
        EC.presence_of_all_elements_located((By.CLASS_NAME, "lotto-correct-primary-numbers"))
    )
    secondary_nums_elements = WebDriverWait(driver, 10).until(
        EC.presence_of_all_elements_located((By.CLASS_NAME, "lotto-correct-secondary-numbers"))
    )
    date_rows = WebDriverWait(driver, 10).until(
        EC.presence_of_all_elements_located((By.XPATH, "//h3[contains(@class, 'date-row')]//span[@class='pull-right']"))
    )
    start_date = datetime.date(2024, 1, 1)
    end_date = calculate_end_date(start_date)
    for date, primary, secondary in zip(date_rows, primary_nums_elements, secondary_nums_elements):
        lotto_results.append({
            "date": date.text,
            "primary": primary.text.replace("\n", ", "),
            "secondary": secondary.text
        })
    return lotto_results

# Process and save results
lotto_results = []
start_date = datetime.date(1980, 1, 1)
end_date = calculate_end_date(start_date)
forward = False
while end_date < target_end_date:
    lotto_results = get_lotto(start_date, end_date, lotto_results, forward)
    start_date = end_date + datetime.timedelta(days=1)
    end_date = calculate_end_date(start_date)
    forward = True
    

with open("results.txt", "w", encoding="utf-8") as file:
    for result in lotto_results:
        file.write(f"Date: {result['date']}\n")
        file.write(f"Primary Numbers: {result['primary']}\n")
        file.write(f"Secondary Number: {result['secondary']}\n")
        file.write("\n")

print("Results saved to results.txt.")
driver.quit()