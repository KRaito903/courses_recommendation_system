import pickle
import numpy as np

# Define the path to your file
dir = './amazon/'
file_path_trnMat = dir + 'trnMat.pkl'
file_path_tstMat = dir + 'tstMat.pkl'

try:
    # Open the file in binary read mode ('rb')
    with open(file_path_trnMat, 'rb') as f:
        # Load the data from the file
        data_trnMat = pickle.load(f)
    
    # Now 'data' holds whatever Python object was saved in the file
    print(f"Successfully loaded data from {file_path_trnMat}")
    print(f"Type of loaded data: {type(data_trnMat)}")

    # Assuming 'data' is your loaded coo_matrix
    print(f"Shape: {data_trnMat.shape}")       # (number_of_rows, number_of_columns)
    print(f"Data type: {data_trnMat.dtype}")  # The type of data (e.g., float64, int32)
    print(f"Non-zero elements: {data_trnMat.nnz}") # Count of non-zero values

    # Print the first 10 non-zero values and their coordinates
    print("\n--- COO Components (First 10) ---")
    print(f"Row indices: {data_trnMat.row[:10]}")
    print(f"Col indices: {data_trnMat.col[:10]}")
    print(f"Data values: {data_trnMat.data[:10]}")

    # Assuming 'data' is your loaded coo_matrix
    unique_values = np.unique(data_trnMat.data)

    print(f"All unique non-zero values: {unique_values}")

except FileNotFoundError:
    print(f"Error: The file '{file_path_trnMat}' was not found.")
except pickle.UnpicklingError:
    print(f"Error: The file '{file_path_trnMat}' is corrupted or not a valid pickle file.")
except Exception as e:
    print(f"An error occurred: {e}")



# try:
#     # Open the file in binary read mode ('rb')
#     with open(file_path_tstMat, 'rb') as f:
#         # Load the data from the file
#         data_tstMat = pickle.load(f)
    
#     # Now 'data' holds whatever Python object was saved in the file
#     print(f"Successfully loaded data from {file_path_tstMat}")
#     print(f"Type of loaded data: {type(data_tstMat)}")

# except FileNotFoundError:
#     print(f"Error: The file '{file_path_tstMat}' was not found.")
# except pickle.UnpicklingError:
#     print(f"Error: The file '{file_path_tstMat}' is corrupted or not a valid pickle file.")
# except Exception as e:
#     print(f"An error occurred: {e}")