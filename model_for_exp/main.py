from pathlib import Path
from data_generator import DataGenerator
from graph_builder import GraphBuilder
from data_preprocessor import DataPreprocessor
from data_loader import DataLoader
from model import CourseRecommendationModel
import time
import os
import json

# Get the directory of the current Python file (e.g., main.py)
BASE_DIR = Path(__file__).resolve().parent

IS_GENERATE_DATA = False
IS_PREPROCESS_DATA = False
IS_VISUALIZE_GRAPH = False
IS_TRAIN_MODEL = True
IS_EVAL_MODEL = True
IS_RECOMMEND_COURSES = False
IS_SAVE_RECOMMENDATIONS = False
IS_RUN_GENERATED = False
IS_RUN_PREPROCESSED = False
IS_RUN_AMAZON = True

MODEL_LIST = ['lightgcn', 'gcn', 'graphsage', 'kgat']
AMAZON_SAMPLE_USER_RATE = 0.1
AMAZON_SAMPLE_ITEM_RATE = 0.1
AMAZON_SAMPLE_RANDOM_SEED = 36

DATASET_FILEPATH = str(BASE_DIR / 'data' / 'generated-dataset_500-students_150-courses.json')
PREPROCESSED_DATASET_FILEPATH = str(BASE_DIR / 'data' / 'preprocessed-dataset_500-students_150-courses.json')
VISUALIZED_STUDENT_IDS = [0]
VISUALIZED_NEIGHBOR_HOPS = 2
RECOMMENDATION_REQUESTED_FILEPATH = str(BASE_DIR / 'requests' / 'recommendation_requests.json')

# Amazon dataset settings
AMAZON_TRAIN_FILEPATH = str(BASE_DIR / 'data' / 'amazon' / 'trnMat.pkl')
AMAZON_TEST_FILEPATH = str(BASE_DIR / 'data' / 'amazon' / 'tstMat.pkl')

# Pass the absolute path to your loader
CONFIG_FILEPATH = str(BASE_DIR / 'config' / 'default_config.json')
config = DataLoader.load_config(config_path=str(CONFIG_FILEPATH))

# If present in config, override Amazon sampling defaults (useful for quick tests)
AMAZON_SAMPLE_USER_RATE = config.get('AMAZON_SAMPLE_USER_RATE', AMAZON_SAMPLE_USER_RATE)
AMAZON_SAMPLE_ITEM_RATE = config.get('AMAZON_SAMPLE_ITEM_RATE', AMAZON_SAMPLE_ITEM_RATE)
AMAZON_SAMPLE_RANDOM_SEED = config.get('AMAZON_SAMPLE_RANDOM_SEED', AMAZON_SAMPLE_RANDOM_SEED)

# Global variables from config (use .get with sensible defaults to avoid KeyError)
NUM_STUDENT = config.get('NUM_STUDENT', 500)
NUM_COURSE = config.get('NUM_COURSE', 150)
AVG_ENROLLED_COURSES_PER_STUDENT = config.get('AVG_ENROLLED_COURSES_PER_STUDENT', 8)
AVG_WILL_ENROLL_COURSES_PER_STUDENT = config.get('AVG_WILL_ENROLL_COURSES_PER_STUDENT', 2)

GENERATED_FILEPATH_PREFIX = config.get('GENERATED_FILEPATH_PREFIX', str(BASE_DIR / 'data' / 'generated-dataset'))
PREPROCESSED_FILEPATH_PREFIX = config.get('PREPROCESSED_FILEPATH_PREFIX', str(BASE_DIR / 'data' / 'preprocessed-dataset'))
TRAINED_MODEL_FILEPATH = config.get('TRAINED_MODEL_FILEPATH', str(BASE_DIR / 'model' / 'course_recommendation_model.pth'))
RECOMMENDATIONS_FILEPATH_PREFIX = config.get('RECOMMENDATIONS_FILEPATH_PREFIX', str(BASE_DIR / 'data' / 'recommendations'))

STUDENT_CODE_LENGTH = config.get('STUDENT_CODE_LENGTH', 8)
STUDENT_MAJOR_CODE_LIST = config.get('STUDENT_MAJOR_CODE_LIST', [])
SEMESTER_LIST = config.get('SEMESTER_LIST', [1,4,7,10])
GPA_SCALE = config.get('GPA_SCALE', 10.0)
DEFAULT_IMAGE_URL = config.get('DEFAULT_IMAGE_URL', '')
INIT_SEMESTER_BY_STUDENT_CODE_PREFIX = config.get('INIT_SEMESTER_BY_STUDENT_CODE_PREFIX', {})
COURSE_CODE_LENGTH = config.get('COURSE_CODE_LENGTH', 8)
COURSE_NAME_PREFIX_LIST = config.get('COURSE_NAME_PREFIX_LIST', [])
COURSE_MAJOR_CODE_LIST = config.get('COURSE_MAJOR_CODE_LIST', [])
SEMESTER_RANGE = config.get('SEMESTER_RANGE', [1,12])
CREDIT_LIST = config.get('CREDIT_LIST', [2,4,6])
WEIGHT_VALUES = config.get('WEIGHT_VALUES', [0.0,0.25,0.5,1.0])
ENROLLMENT_LIST = config.get('ENROLLMENT_LIST', ['liked','disliked','will_enroll'])

# Mappings and encodings
ONEHOT_STUDENT_MAJOR = config.get('ONEHOT_STUDENT_MAJOR', {})
MANYHOTS_COURSE_MAJOR = config.get('MANYHOTS_COURSE_MAJOR', {})
ENROLLMENT_WEIGHT = config.get('ENROLLMENT_WEIGHT', {'liked':1.0,'disliked':-1.0,'will_enroll':0.5})

# Training / evaluation params
NUM_EPOCHS = config.get('NUM_EPOCHS', 1000)
BATCH_SIZE = config.get('BATCH_SIZE', 256)
NUM_NEGATIVE = config.get('NUM_NEGATIVE', 5)
TEST_SPLIT = config.get('TEST_SPLIT', 0.2)
VALID_SPLIT = config.get('VALID_SPLIT', 0.1)

EARLY_STOPPING_PATIENCE = config.get('EARLY_STOPPING_PATIENCE', 10)
EARLY_STOPPING_MIN_DELTA = config.get('EARLY_STOPPING_MIN_DELTA', 0.0001)
USE_EARLY_STOPPING = config.get('USE_EARLY_STOPPING', True)

# Evaluation / models
K_LIST = config.get('K_LIST', [1,3,5])
EMBEDDING_DIM = config.get('EMBEDDING_DIM', 128)
NUM_LAYERS = config.get('NUM_LAYERS', 5)
EVAL_INTERVAL = config.get('EVAL_INTERVAL', 10)
TOP_K = config.get('TOP_K', 10)

# Runtime overrides: allow Kaggle notebook cells to set environment variables or write
# a JSON file and point to it via RUNTIME_CONFIG_PATH. This lets users change
# globals (MODEL_LIST, sample rates, flags, hyperparams) from the notebook.
runtime_config = {}
rc_path = os.environ.get('RUNTIME_CONFIG_PATH') or os.environ.get('RUNTIME_CONFIG')
if rc_path and os.path.exists(rc_path):
    try:
        with open(rc_path, 'r', encoding='utf-8') as _f:
            runtime_config = json.load(_f)
    except Exception:
        runtime_config = {}

def _parse_bool(v):
    if isinstance(v, bool):
        return v
    if isinstance(v, (int, float)):
        return bool(v)
    s = str(v).strip().lower()
    return s in ('1', 'true', 'yes', 'y')

def _get_override(name, default=None, cast=None):
    # Check environment first
    if name in os.environ:
        raw = os.environ[name]
        try:
            if cast is list:
                # Accept JSON array or comma-separated
                try:
                    return json.loads(raw)
                except Exception:
                    return [x.strip() for x in raw.split(',') if x.strip()]
            if cast is bool:
                return _parse_bool(raw)
            if cast:
                return cast(raw)
            return raw
        except Exception:
            return default

    # Then check runtime_config JSON file
    if name in runtime_config:
        val = runtime_config[name]
        if cast is list and isinstance(val, str):
            try:
                return json.loads(val)
            except Exception:
                return [x.strip() for x in val.split(',') if x.strip()]
        if cast is bool:
            return _parse_bool(val)
        try:
            return cast(val) if cast else val
        except Exception:
            return val

    return default

# Apply common overrides useful on Kaggle (set via os.environ in a notebook cell)
MODEL_LIST = _get_override('MODEL_LIST', MODEL_LIST, list)
IS_TRAIN_MODEL = _get_override('IS_TRAIN_MODEL', IS_TRAIN_MODEL, bool)
IS_EVAL_MODEL = _get_override('IS_EVAL_MODEL', IS_EVAL_MODEL, bool)
IS_RUN_GENERATED = _get_override('IS_RUN_GENERATED', IS_RUN_GENERATED, bool)
IS_RUN_PREPROCESSED = _get_override('IS_RUN_PREPROCESSED', IS_RUN_PREPROCESSED, bool)
IS_RUN_AMAZON = _get_override('IS_RUN_AMAZON', IS_RUN_AMAZON, bool)

AMAZON_SAMPLE_USER_RATE = float(_get_override('AMAZON_SAMPLE_USER_RATE', AMAZON_SAMPLE_USER_RATE, float))
AMAZON_SAMPLE_ITEM_RATE = float(_get_override('AMAZON_SAMPLE_ITEM_RATE', AMAZON_SAMPLE_ITEM_RATE, float))
AMAZON_SAMPLE_RANDOM_SEED = int(_get_override('AMAZON_SAMPLE_RANDOM_SEED', AMAZON_SAMPLE_RANDOM_SEED, int))

# Training hyperparams overrides
NUM_EPOCHS = int(_get_override('NUM_EPOCHS', NUM_EPOCHS, int))
BATCH_SIZE = int(_get_override('BATCH_SIZE', BATCH_SIZE, int))
EMBEDDING_DIM = int(_get_override('EMBEDDING_DIM', EMBEDDING_DIM, int))
NUM_LAYERS = int(_get_override('NUM_LAYERS', NUM_LAYERS, int))
K_LIST = _get_override('K_LIST', K_LIST, list)


# Helper to train & evaluate all models on a given preprocessed dataset
def run_models_on_preprocessed(preprocessed_dataset: dict, dataset_name: str = 'dataset'):
    results = {}
    print(f"\n[4] Running models on preprocessed '{dataset_name}' dataset...")
    for model_type in MODEL_LIST:
        print(f"\n--- Model: {model_type} on {dataset_name} ---")
        model_filepath = TRAINED_MODEL_FILEPATH.replace('.pth', f'_{model_type}_{dataset_name}.pth')

        model = CourseRecommendationModel(data=preprocessed_dataset, embedding_dim=EMBEDDING_DIM, num_layers=NUM_LAYERS,
                                            using_unenrolled_for_test=True, unenrolled_rate_in_graph=0.0,
                                            test_split=TEST_SPLIT, valid_split=VALID_SPLIT, model_type=model_type)

        # Decide evaluation ks for Amazon runs. If the sample rates are the small
        # quick-test defaults (0.1, 0.1), include @20 and @40 in evaluation.
        if AMAZON_SAMPLE_USER_RATE == 0.1 and AMAZON_SAMPLE_ITEM_RATE == 0.1:
            ks_for_amazon = sorted(set(K_LIST + [20, 40]))
        else:
            ks_for_amazon = K_LIST

        start_time = time.time()
        if IS_TRAIN_MODEL:
            model.train(num_epochs=NUM_EPOCHS, batch_size=BATCH_SIZE,
                        num_negative=NUM_NEGATIVE,
                        is_eval_during_training=False, ks=ks_for_amazon,
                        is_save_model=True, filepath=model_filepath,
                        early_stopping_patience=EARLY_STOPPING_PATIENCE,
                        early_stopping_min_delta=EARLY_STOPPING_MIN_DELTA,
                        use_early_stopping=USE_EARLY_STOPPING)
        else:
            try:
                model.load_model(model_filepath)
                print(f"Loaded model from '{model_filepath}'")
            except Exception:
                print(f"Could not load model from '{model_filepath}' — training instead.")
                model.train(num_epochs=NUM_EPOCHS, batch_size=BATCH_SIZE,
                            num_negative=NUM_NEGATIVE,
                            is_eval_during_training=False, ks=K_LIST,
                            is_save_model=True, filepath=model_filepath,
                            early_stopping_patience=EARLY_STOPPING_PATIENCE,
                            early_stopping_min_delta=EARLY_STOPPING_MIN_DELTA,
                            use_early_stopping=USE_EARLY_STOPPING)
        train_time = time.time() - start_time

        if IS_EVAL_MODEL:
            evaluation = model.evaluate(ks=ks_for_amazon)
            # Normalize keys to consistent naming for printing
            model_result = {'mrr': evaluation.get('mrr', 0.0)}
            for k in ks_for_amazon:
                model_result[f'hit@{k}'] = evaluation.get(f'hit@{k}', 0.0)
                model_result[f'recall@{k}'] = evaluation.get(f'recall@{k}', 0.0)
                model_result[f'ndcg@{k}'] = evaluation.get(f'ndcg@{k}', 0.0)
            model_result['train_time_sec'] = train_time
            results[model_type] = model_result
            print(f"  Results for {model_type} on {dataset_name}: MRR={model_result['mrr']:.4f}, time={train_time:.1f}s")
            for k in ks_for_amazon:
                print(f"    Hit@{k}: {model_result[f'hit@{k}']:.4f}, Recall@{k}: {model_result[f'recall@{k}']:.4f}, NDCG@{k}: {model_result[f'ndcg@{k}']:.4f}")
    return results


def sample_amazon_dataset(amazon_data: dict, user_rate: float = 1.0, item_rate: float = 1.0, seed: int = 36) -> dict:
    """Return a subsampled copy of the amazon_data dictionary.

    Sampling uses random selection of users (rows) and items (columns). The returned
    dataset is reindexed to contiguous student_id and course_id starting at 0.
    """
    import numpy as np
    import scipy.sparse as sp

    if user_rate >= 1.0 and item_rate >= 1.0:
        return amazon_data

    rng = np.random.default_rng(seed)
    num_users = amazon_data['num_users']
    num_items = amazon_data['num_items']

    user_k = max(1, int(num_users * user_rate))
    item_k = max(1, int(num_items * item_rate))

    user_idx = np.sort(rng.choice(num_users, size=user_k, replace=False))
    item_idx = np.sort(rng.choice(num_items, size=item_k, replace=False))

    # Subset sparse matrices (use CSR for efficient row slicing)
    train_small = amazon_data['train_matrix'].tocsr()[user_idx, :][:, item_idx].tocoo()
    test_small = amazon_data['test_matrix'].tocsr()[user_idx, :][:, item_idx].tocoo()

    # Build new students/courses lists and enrollments with reindexed ids
    students = [{'student_id': int(i)} for i in range(user_k)]
    courses = [{'course_id': int(i)} for i in range(item_k)]

    enrollments = []
    for u, v in zip(train_small.row, train_small.col):
        enrollments.append({'student_id': int(u), 'course_id': int(v), 'is_enrolled': 1})
    for u, v in zip(test_small.row, test_small.col):
        enrollments.append({'student_id': int(u), 'course_id': int(v), 'is_enrolled': 0})

    return {
        'students': students,
        'courses': courses,
        'enrollments': enrollments,
        'train_matrix': train_small,
        'test_matrix': test_small,
        'num_users': user_k,
        'num_items': item_k,
    }

# Helper to train & evaluate all models on Amazon dataset
def run_models_on_amazon(amazon_dataset: dict, dataset_name: str = 'amazon'):
    results = {}
    print(f"\n[Amazon] Running models on Amazon Books dataset...")
    print(f"  - Users: {amazon_dataset['num_users']}")
    print(f"  - Items: {amazon_dataset['num_items']}")
    print(f"  - Train interactions: {amazon_dataset['train_matrix'].nnz}")
    print(f"  - Test interactions: {amazon_dataset['test_matrix'].nnz}")
    # Decide evaluation ks for Amazon runs. If the sample rates are the small
    # quick-test defaults (0.1, 0.1), include @20 and @40 in evaluation.
    if AMAZON_SAMPLE_USER_RATE == 0.1 and AMAZON_SAMPLE_ITEM_RATE == 0.1:
        ks_for_amazon = sorted(set(K_LIST + [20, 40]))
    else:
        ks_for_amazon = K_LIST
    
    for model_type in MODEL_LIST:
        print(f"\n--- Model: {model_type} on {dataset_name} ---")
        model_filepath = TRAINED_MODEL_FILEPATH.replace('.pth', f'_{model_type}_{dataset_name}.pth')

        # Some models (GCN, GraphSAGE) require node features. The Amazon dataset
        # only contains interaction matrices; generate simple numeric features
        # (log-degree) on-the-fly for quick testing if they are missing.
        local_data = dict(amazon_dataset)  # shallow copy
        if model_type in ['gcn', 'graphsage']:
            if 'student_features' not in local_data or 'course_features' not in local_data:
                try:
                    import numpy as _np
                    train_mat = amazon_dataset['train_matrix'].tocsr()
                    # user degrees (number of interactions per user)
                    user_deg = _np.asarray(train_mat.sum(axis=1)).reshape(-1)
                    item_deg = _np.asarray(train_mat.sum(axis=0)).reshape(-1)
                    # use log1p to compress large counts and cast to float32
                    user_feat = _np.log1p(user_deg).astype(_np.float32).reshape(-1, 1)
                    item_feat = _np.log1p(item_deg).astype(_np.float32).reshape(-1, 1)
                    local_data['student_features'] = user_feat
                    local_data['course_features'] = item_feat
                    print(f"  → Generated simple features for model '{model_type}' (student/item dims: {user_feat.shape[1]}/{item_feat.shape[1]})")
                except Exception as _e:
                    print(f"  ! Failed to generate fallback features for '{model_type}': {_e}")
                    raise

        model = CourseRecommendationModel(data=local_data, embedding_dim=EMBEDDING_DIM, num_layers=NUM_LAYERS,
                                            using_unenrolled_for_test=True, unenrolled_rate_in_graph=0.0,
                                            test_split=TEST_SPLIT, valid_split=VALID_SPLIT, model_type=model_type)

        start_time = time.time()
        if IS_TRAIN_MODEL:
            model.train(num_epochs=NUM_EPOCHS, batch_size=BATCH_SIZE,
                        num_negative=NUM_NEGATIVE,
                        is_eval_during_training=False, ks=ks_for_amazon,
                        is_save_model=True, filepath=model_filepath,
                        early_stopping_patience=EARLY_STOPPING_PATIENCE,
                        early_stopping_min_delta=EARLY_STOPPING_MIN_DELTA,
                        use_early_stopping=USE_EARLY_STOPPING)
        else:
            try:
                model.load_model(model_filepath)
                print(f"Loaded model from '{model_filepath}'")
            except Exception:
                print(f"Could not load model from '{model_filepath}' — training instead.")
                model.train(num_epochs=NUM_EPOCHS, batch_size=BATCH_SIZE,
                            num_negative=NUM_NEGATIVE,
                            is_eval_during_training=False, ks=ks_for_amazon,
                            is_save_model=True, filepath=model_filepath,
                            early_stopping_patience=EARLY_STOPPING_PATIENCE,
                            early_stopping_min_delta=EARLY_STOPPING_MIN_DELTA,
                            use_early_stopping=USE_EARLY_STOPPING)

        train_time = time.time() - start_time

        if IS_EVAL_MODEL:
            evaluation = model.evaluate(ks=ks_for_amazon)
            # Normalize keys to consistent naming for printing
            model_result = {
                'mrr': evaluation.get('mrr', 0.0),
            }
            for k in ks_for_amazon:
                model_result[f'hit@{k}'] = evaluation.get(f'hit@{k}', 0.0)
                model_result[f'recall@{k}'] = evaluation.get(f'recall@{k}', 0.0)
                model_result[f'ndcg@{k}'] = evaluation.get(f'ndcg@{k}', 0.0)
            model_result['train_time_sec'] = train_time
            results[model_type] = model_result
            print(f"  Results for {model_type} on {dataset_name}: MRR={model_result['mrr']:.4f}, time={train_time:.1f}s")
            for k in ks_for_amazon:
                print(f"    Hit@{k}: {model_result[f'hit@{k}']:.4f}, Recall@{k}: {model_result[f'recall@{k}']:.4f}, NDCG@{k}: {model_result[f'ndcg@{k}']:.4f}")
    return results

def main():  
    # Step 1: Generate dataset if needed
    if IS_GENERATE_DATA:
        print(f"\n[1] Generating synthetic dataset...")
        # Use the corrected generate_dataset staticmethod from mdata_generator
        dataset = DataGenerator.generate_data(
            num_student=NUM_STUDENT,
            num_course=NUM_COURSE,
            avg_enrolled_courses_per_student=AVG_ENROLLED_COURSES_PER_STUDENT,
            avg_will_enroll_courses_per_student=AVG_WILL_ENROLL_COURSES_PER_STUDENT,
            student_code_length=STUDENT_CODE_LENGTH,
            student_major_code_list=STUDENT_MAJOR_CODE_LIST,
            semester_list=SEMESTER_LIST,
            gpa_scale=GPA_SCALE,
            default_image_url=DEFAULT_IMAGE_URL,
            init_semester_by_student_code_prefix=INIT_SEMESTER_BY_STUDENT_CODE_PREFIX,
            course_code_length=COURSE_CODE_LENGTH,
            course_name_prefix_list=COURSE_NAME_PREFIX_LIST,
            course_major_code_list=COURSE_MAJOR_CODE_LIST,
            semester_range=SEMESTER_RANGE,
            credit_list=CREDIT_LIST,
            weight_values=WEIGHT_VALUES,
            enrollment_list=ENROLLMENT_LIST,
            is_save_json=True,
            generated_filepath_prefix=GENERATED_FILEPATH_PREFIX
        )
    else:
        # Load existing dataset
        dataset = DataLoader.load_generated_dataset(filepath=DATASET_FILEPATH)
        print(f"\n[1] Loaded existing dataset from '{DATASET_FILEPATH}'")
        print(f"  - Students: {len(dataset['students'])}")
        print(f"  - Courses: {len(dataset['courses'])}")
        print(f"  - Enrollments: {len(dataset['enrollments'])}")
    
    # Step 2: Build and visualize knowledge graph and visualize
    if IS_VISUALIZE_GRAPH:
        print(f"\n[2] Building and visualizing knowledge graph...")
        graph_builder = GraphBuilder(data=dataset, unenrolled_rate=0.0)
        knowledge_graph = graph_builder.build_visualization_graph(include_will_enroll=False,
                    is_save_gexf=True, built_graph_filepath_prefix='./data/built-graph')
        # Visualize a small subgraph for easier inspection
        small_subgraph = graph_builder.get_subgraph_for_students(knowledge_graph,
                                                                VISUALIZED_STUDENT_IDS, radius=VISUALIZED_NEIGHBOR_HOPS)
        graph_builder.visualize(small_subgraph, figsize=(10, 8), show_labels=True, node_size=200,
                is_save_img=True, visualized_graph_filepath_prefix='./data/visualized-graph',
                seed_students=VISUALIZED_STUDENT_IDS, hops=VISUALIZED_NEIGHBOR_HOPS)
		
    # Step 3: Preprocess dataset if needed
    if IS_PREPROCESS_DATA:
        print(f"\n[3] Preprocessing dataset...")
        preprocessed_data = DataPreprocessor.preprocess_data(
            dataset,
            max_semester=max(SEMESTER_LIST),
            gpa_scale=GPA_SCALE,
            num_majors=len(COURSE_MAJOR_CODE_LIST),
            is_save_json=True,
            preprocessed_filepath_prefix=PREPROCESSED_FILEPATH_PREFIX
        )
    else:
        preprocessed_data = DataLoader.load_preprocessed_dataset(filepath=PREPROCESSED_DATASET_FILEPATH)
        print(f"\n[3] Loaded existing preprocessed dataset from '{PREPROCESSED_DATASET_FILEPATH}'")
        print(f"  - Students: {len(preprocessed_data['students'])}")
        print(f"  - Courses: {len(preprocessed_data['courses'])}")
        print(f"  - Enrollments: {len(preprocessed_data['enrollments'])}")

    # Step 4/5: Train & evaluate all models on both datasets (generated->preprocessed and the preprocessed file)
    # Preprocess the generated dataset to get a preprocessed version for fair comparison
    results_generated = {}
    results_preprocessed = {}
    results_amazon = {}
    
    if IS_RUN_GENERATED:
        print("\nPreparing preprocessed version of the generated dataset for comparison...")
        preprocessed_from_generated = DataPreprocessor.preprocess_data(
            dataset,
            max_semester=max(SEMESTER_LIST),
            gpa_scale=GPA_SCALE,
            num_majors=len(COURSE_MAJOR_CODE_LIST),
            is_save_json=False,
            preprocessed_filepath_prefix=GENERATED_FILEPATH_PREFIX + '_preprocessed'
        )
        # Run models on the preprocessed dataset derived from generated data
        results_generated = run_models_on_preprocessed(preprocessed_from_generated, 'generated')

    if IS_RUN_PREPROCESSED:
        # Run models on the provided preprocessed dataset (loaded from file)
        results_preprocessed = run_models_on_preprocessed(preprocessed_data, 'preprocessed')

    # Step 5: Run models on Amazon Books dataset if enabled
    if IS_RUN_AMAZON:
        try:
            print(f"\n[5] Loading Amazon Books dataset...")
            amazon_data = DataLoader.load_amazon_dataset(
                train_filepath=AMAZON_TRAIN_FILEPATH,
                test_filepath=AMAZON_TEST_FILEPATH
            )
            # Optionally sample a small portion for quick testing to avoid OOM / long runs
            if AMAZON_SAMPLE_USER_RATE < 1.0 or AMAZON_SAMPLE_ITEM_RATE < 1.0:
                print(f"Sampling Amazon dataset: users {AMAZON_SAMPLE_USER_RATE*100:.1f}%, items {AMAZON_SAMPLE_ITEM_RATE*100:.1f}%")
                amazon_data = sample_amazon_dataset(amazon_data,
                                                    user_rate=AMAZON_SAMPLE_USER_RATE,
                                                    item_rate=AMAZON_SAMPLE_ITEM_RATE,
                                                    seed=AMAZON_SAMPLE_RANDOM_SEED)
                print(f"  -> Sampled Users: {amazon_data['num_users']}, Items: {amazon_data['num_items']}")
            results_amazon = run_models_on_amazon(amazon_data, 'amazon')
        except Exception as e:
            print(f"Error loading/running Amazon dataset: {e}")
            import traceback
            traceback.print_exc()

    # Print a compact comparison summary
    if IS_EVAL_MODEL:
        print("\n" + "="*80)
        print("=== Comparative Summary (MRR, Hit@k, NDCG@k) ===")
        print("="*80)
        
        for model_type in MODEL_LIST:
            gen_res = results_generated.get(model_type, {})
            pre_res = results_preprocessed.get(model_type, {})
            amz_res = results_amazon.get(model_type, {})
            
            print(f"\nModel: {model_type}")
            
            if IS_RUN_GENERATED and gen_res:
                print(f"  Generated Dataset - MRR: {gen_res.get('mrr',0):.4f}, Time: {gen_res.get('train_time_sec',0):.1f}s")
                print(f"    ", end='')
                for k in K_LIST:
                    print(f"Hit@{k}:{gen_res.get(f'hit@{k}',0):.4f} NDCG@{k}:{gen_res.get(f'ndcg@{k}',0):.4f}; ", end='')
                print()
            
            if IS_RUN_PREPROCESSED and pre_res:
                print(f"  Preprocessed Dataset - MRR: {pre_res.get('mrr',0):.4f}, Time: {pre_res.get('train_time_sec',0):.1f}s")
                print(f"    ", end='')
                for k in K_LIST:
                    print(f"Hit@{k}:{pre_res.get(f'hit@{k}',0):.4f} NDCG@{k}:{pre_res.get(f'ndcg@{k}',0):.4f}; ", end='')
                print()
            
            if IS_RUN_AMAZON and amz_res:
                print(f"  Amazon Books Dataset - MRR: {amz_res.get('mrr',0):.4f}, Time: {amz_res.get('train_time_sec',0):.1f}s")
                # Detect ks present in the amazon results (they are stored as keys like 'hit@k')
                ks_amz = sorted({int(k.split('@')[1]) for k in amz_res.keys() if k.startswith('hit@')})
                print(f"    ", end='')
                for k in ks_amz:
                    hit_v = amz_res.get(f'hit@{k}', 0.0)
                    recall_v = amz_res.get(f'recall@{k}', None)
                    ndcg_v = amz_res.get(f'ndcg@{k}', 0.0)
                    if recall_v is not None:
                        print(f"Hit@{k}:{hit_v:.4f} Recall@{k}:{recall_v:.4f} NDCG@{k}:{ndcg_v:.4f}; ", end='')
                    else:
                        print(f"Hit@{k}:{hit_v:.4f} NDCG@{k}:{ndcg_v:.4f}; ", end='')
                print()
        
        print("\n" + "="*80)

    # Step 6: Show sample recommendations
    # Recommendation sampling is intentionally disabled in this comparative run
    if IS_RECOMMEND_COURSES:
        print("\n[6] Recommendation sampling was requested but is currently disabled for the comparative pipeline.")
        print("Enable and adapt the recommendation block if you want per-model sample recommendations.")
 
if __name__ == "__main__":
    main()