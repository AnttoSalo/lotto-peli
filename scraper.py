from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import datetime
import time

# Helper function to calculate the end date of an 11-week range
def calculate_end_date(start_date):
    return start_date + datetime.timedelta(weeks=11)

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
    accept_cookies_button.click()  # Click the button to accept cookies
    print("Cookies accepted.")
except Exception as e:
    print(f"Error accepting cookies: {e}")

# Locate the parent container for date pickers
date_picker_container = WebDriverWait(driver, 10).until(
    EC.presence_of_element_located((By.CLASS_NAME, "datepicker-module__range--KDXuF"))
)

# Define the date range
start_date = datetime.date(2024, 1, 1)
end_date = calculate_end_date(start_date)

# Convert dates to Finnish format (dd.mm.yyyy)
start_date_str = start_date.strftime("%d.%m.%Y")
end_date_str = end_date.strftime("%d.%m.%Y")

# Open the calendar for the start date
calendar_buttons = date_picker_container.find_elements(By.CLASS_NAME, "datepicker-module__calendarIcon--duap6")
calendar_buttons[0].click()

# Navigate to the correct month for the start date
while True:
    caption = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, "DayPicker-Caption"))
    ).text
    if get_finnish_full_month_name(start_date) in caption.lower():
        break
    previous_button = driver.find_element(By.CSS_SELECTOR, ".DayPicker-NavButton--previous")
    previous_button.click()

# Select the start date
start_weekday = get_finnish_weekday(start_date)
start_month = get_finnish_month_name(start_date)
start_date_element = WebDriverWait(driver, 10).until(
    EC.element_to_be_clickable((By.XPATH, f"//div[@aria-label='{start_weekday} {start_date.day}. {start_month} 2024']"))
)
start_date_element.click()

# Open the calendar for the end date
calendar_buttons[1].click()

# Navigate to the correct month for the end date
while True:
    caption = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, "DayPicker-Caption"))
    ).text
    if get_finnish_full_month_name(end_date) in caption.lower():
        break
    next_button = driver.find_element(By.CSS_SELECTOR, ".DayPicker-NavButton--previous")
    next_button.click()

# Select the end date
end_weekday = get_finnish_weekday(end_date)
end_month = get_finnish_month_name(end_date)
end_date_element = WebDriverWait(driver, 10).until(
    EC.element_to_be_clickable((By.XPATH, f"//div[@aria-label='{end_weekday} {end_date.day}. {end_month} 2024']"))
)
end_date_element.click()

# Confirm the selected date range for debugging
print(f"Start Date Selected: {start_date_str}")
print(f"End Date Selected: {end_date_str}")

result_button = WebDriverWait(driver, 10).until(
    EC.element_to_be_clickable((By.ID, "nav__date-search"))
)
result_button.click()

# Wait for all primary lotto number elements to load
primary_nums_elements = WebDriverWait(driver, 10).until(
    EC.presence_of_all_elements_located((By.CLASS_NAME, "lotto-correct-primary-numbers"))
)

# Wait for all secondary lotto number elements to load
secondary_nums_elements = WebDriverWait(driver, 10).until(
    EC.presence_of_all_elements_located((By.CLASS_NAME, "lotto-correct-secondary-numbers"))
)
# Locate the h3 element
date_rows = WebDriverWait(driver, 10).until(
    EC.presence_of_all_elements_located((By.XPATH, "//h3[contains(@class, 'date-row')]//span[@class='pull-right']"))
)

lotto_nums = []
# Ensure both lists have the same length
if len(primary_nums_elements) != len(secondary_nums_elements):
    print("Warning: Mismatch between primary and secondary numbers!")
else:
    for i, (primary, secondary) in enumerate(zip(primary_nums_elements, secondary_nums_elements), start=1):
        arr = primary.text.split("\n")
        arr.append(secondary.text)
        lotto_nums.append(arr)

with open('results.txt', 'w') as file:
    file.write("Lotto Results:\n")
    for arr in lotto_nums:
        file.write(f"Result {i}:\n")
        file.write(f"  Primary Numbers: {arr[0]}\n")
        file.write(f"  Secondary Number: {arr[1]}\n")