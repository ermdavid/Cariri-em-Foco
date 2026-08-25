import os
import sys

DIR_BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if DIR_BACKEND not in sys.path:
    sys.path.insert(0, DIR_BACKEND)
