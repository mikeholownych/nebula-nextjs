import os

def check_sales():
    sales_file = os.path.join(os.getcwd(), "sales.log")
    if os.path.exists(sales_file):
        with open(sales_file, "r") as f:
            sales_data = f.read()
            if "sale" in sales_data.lower():
                print("Sales detected!")
            else:
                print("No sales detected.")
    else:
        print("Sales log file not found.")

if __name__ == "__main__":
    check_sales()
