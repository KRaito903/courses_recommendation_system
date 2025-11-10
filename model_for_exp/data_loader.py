from typing import Dict, Optional, Any
import json
import networkx as nx
import numpy as np
import requests

class DataLoader:
    """Load datasets and graphs from disk or Firebase Realtime Database."""
    @staticmethod
    def _load_json_file(filepath: str) -> Dict:
        """Load JSON from file trying UTF-8 then falling back to cp1252.

        Returns the parsed JSON object (typically a dict).
        """
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except UnicodeDecodeError:
            with open(filepath, 'r', encoding='cp1252') as f:
                return json.load(f)

    @staticmethod
    def load_generated_dataset(filepath: str = './data/generated-dataset.json') -> Dict:
        """Load generated dataset JSON from disk."""
        return DataLoader._load_json_file(filepath)

    @staticmethod
    def load_preprocessed_dataset(filepath: str = './data/preprocessed-dataset.json') -> Dict:
        """Load preprocessed dataset JSON and convert feature lists to numpy arrays.

        The preprocessed JSON is expected to store numeric arrays as lists; this
        method converts them back to numpy arrays for downstream code.
        """
        data = DataLoader._load_json_file(filepath)
        # Defensive: only convert if keys exist
        if 'student_features' in data:
            data['student_features'] = np.array(data['student_features'], dtype=np.float32)
        if 'course_features' in data:
            data['course_features'] = np.array(data['course_features'], dtype=np.float32)
        return data

    @staticmethod
    def load_graph_gexf(filepath: str = './data/built-graph.gexf') -> nx.Graph:
        """Load a graph from a GEXF file into a NetworkX graph."""
        if nx is None:
            raise RuntimeError("networkx required to load graphs")
        return nx.read_gexf(filepath)

    @staticmethod
    def load_from_firebase(firebase_url: str,
                           path: str = '',
                           auth: Optional[str] = None,
                           as_preprocessed: bool = False,
                           timeout: int = 10) -> Dict[str, Any]:
        """Load JSON data from a Firebase Realtime Database using the REST API.

        Args:
            firebase_url: base URL of the Firebase Realtime Database (e.g. https://<project>.firebaseio.com)
            path: optional path within the database (e.g. '/generated-dataset')
            auth: optional database secret or auth token to include as ?auth=TOKEN
            as_preprocessed: if True, convert 'student_features'/'course_features' to numpy arrays
            timeout: request timeout in seconds

        Returns the parsed JSON object.

        Note: this function performs an HTTP GET using the `requests` library.
        If `requests` is not installed, an ImportError with instructions will be raised.
        """
        base = firebase_url.rstrip('/')
        p = path.lstrip('/')
        url = f"{base}/{p}.json" if p else f"{base}.json"
        params = {}
        if auth:
            params['auth'] = auth

        resp = requests.get(url, params=params, timeout=timeout)
        resp.raise_for_status()
        data = resp.json()
        # if as_preprocessed convert lists back to numpy arrays
        if as_preprocessed and isinstance(data, dict):
            if 'student_features' in data:
                data['student_features'] = np.array(data['student_features'], dtype=np.float32)
            if 'course_features' in data:
                data['course_features'] = np.array(data['course_features'], dtype=np.float32)
        return data

    @staticmethod
    def load_config(config_path: str):
        """
        Load configuration from a JSON file.
        """
        if config_path is None:
            config_path = os.path.join(os.path.dirname(__file__), 'config.json')
        # Try reading as UTF-8 first (common for JSON with Unicode). On Windows the
        # default encoding may be cp1252 which can raise UnicodeDecodeError for some
        # characters — fall back to cp1252 if needed.
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            return config
        except UnicodeDecodeError:
            with open(config_path, 'r', encoding='cp1252') as f:
                config = json.load(f)
            return config
        except FileNotFoundError:
            raise
        except Exception:
            # Re-raise to surface parsing errors (invalid JSON etc.)
            raise
    
    @staticmethod
    def load_recommendation_requests(filepath: str = './data/recommendation_requests.json'):
        """Load recommendation requests from a JSON file.
        
        Expected JSON format:
        [
            {"student_id": 4, "semester_filter": 7},
            {"student_id": 10, "semester_filter": 5},
            ...
        ]
        
        Returns:
            List of dictionaries containing 'student_id' and 'semester_filter' keys.
        """
        return DataLoader._load_json_file(filepath)

    @staticmethod
    def load_amazon_dataset(train_filepath: str = './data/amazon/trnMat.pkl',
                           test_filepath: str = './data/amazon/tstMat.pkl') -> Dict:
        """Load Amazon Books dataset from pickle files.
        
        Args:
            train_filepath: Path to training matrix pickle file (sparse matrix)
            test_filepath: Path to test matrix pickle file (sparse matrix)
            
        Returns:
            Dictionary with structure compatible with CourseRecommendationModel:
            {
                'students': list of student dicts with student_id
                'courses': list of course dicts with course_id
                'enrollments': list of enrollment dicts
                'train_matrix': scipy sparse matrix for training
                'test_matrix': scipy sparse matrix for testing
                'num_users': number of users
                'num_items': number of items
            }
        """
        import pickle
        import scipy.sparse as sp
        
        # Load sparse matrices
        with open(train_filepath, 'rb') as f:
            train_mat = pickle.load(f)
        with open(test_filepath, 'rb') as f:
            test_mat = pickle.load(f)
        
        # Convert to COO format for easy access to data
        train_coo = train_mat.tocoo()
        test_coo = test_mat.tocoo()
        
        num_users, num_items = train_mat.shape
        
        # Create students (users) list
        students = [{'student_id': i} for i in range(num_users)]
        
        # Create courses (items) list
        courses = [{'course_id': i} for i in range(num_items)]
        
        # Create enrollments from training matrix (positive interactions)
        enrollments = []
        for user_id, item_id in zip(train_coo.row, train_coo.col):
            enrollments.append({
                'student_id': int(user_id),
                'course_id': int(item_id),
                'is_enrolled': 1
            })
        
        # Add test interactions as unenrolled (for evaluation)
        for user_id, item_id in zip(test_coo.row, test_coo.col):
            enrollments.append({
                'student_id': int(user_id),
                'course_id': int(item_id),
                'is_enrolled': 0
            })
        
        return {
            'students': students,
            'courses': courses,
            'enrollments': enrollments,
            'train_matrix': train_mat,
            'test_matrix': test_mat,
            'num_users': num_users,
            'num_items': num_items
        }
