"""
Frequently Asked Interview Questions (Knowledge Base)
"""

QUESTIONS_BANK = {
    "Software Engineer": [
        "Data Structures & Algorithms: Given an array of integers and a target value, how do you return the indices of two numbers that add up to the target efficiently? (Answer: Hash map, O(n) time)",
        "Data Structures & Algorithms: How do you check if a binary tree is a valid Binary Search Tree (BST)? (Answer: Pass min/max bounds dynamically during recursive traversal)",
        "Data Structures & Algorithms: How do you efficiently solve the 'Climbing Stairs' problem? (Answer: Fibonacci pattern dp[i] = dp[i-1] + dp[i-2], optimize to linear time)",
        "Data Structures & Algorithms: How do you reverse a singly linked list in-place? (Answer: Iterate tracking prev, curr, and next pointers)",
        "Data Structures & Algorithms: What is the primary difference between an array and a linked list? (Answer: Contiguous memory vs discrete nodes with pointers)",
        "OOP: What are the four main principles of Object-Oriented Programming (OOP)? (Answer: Encapsulation, Inheritance, Polymorphism, Abstraction)",
        "OOP: How does OOP differ from Procedure-Oriented Programming (POP)? (Answer: Bottom-up with objects/access vs top-down sequential functions)",
        "OOP: What is the difference between function overloading and overriding? (Answer: Same name/different params in same class vs child redefining parent method)",
        "OOP: What is a static variable? (Answer: Belongs to class blueprint, global state across instances)",
        "OOP: What is the difference between a null pointer and a void pointer? (Answer: Explicit reserved 'nowhere' vs valid address lacking specific type)"
    ],
    "Web Developer": [
        "Web Dev: What is the difference between front-end and back-end development? (Answer: Client-side UI vs server-side logic/APIs)",
        "Web Dev: What is a REST API? (Answer: Stateless communication using HTTP GET/POST/PUT/DELETE)",
        "Web Dev: What is Cross-Origin Resource Sharing (CORS) and how do you handle it? (Answer: Browser security, handled via Access-Control-Allow-Origin headers)",
        "Web Dev: What is the exact difference between == and === in JavaScript? (Answer: Value w/ coercion vs strict value and type)",
        "Web Dev: What are semantic HTML tags? (Answer: Tags like <header>, <article> describing structural purpose for SEO/accessibility)",
        "Web Dev: Explain the difference between client-side and server-side rendering. (Answer: Browser executes JS vs Backend pre-compiles HTML)",
        "Web Dev: How do JavaScript Promises and async/await work? (Answer: Handling async operations, async/await as syntactic sugar)",
        "Web Dev: What is the Document Object Model (DOM)? (Answer: In-memory tree representation of webpage for script manipulation)",
        "Web Dev: What is an event loop in Node.js? (Answer: Non-blocking I/O mechanism allowing single-thread to offload tasks to kernel)",
        "Web Dev: What is the difference between Local Storage and Cookies? (Answer: Large local data vs small session data sent with every request)"
    ],
    "Machine Learning Engineer": [
        "AI/ML: How does Machine Learning differ from traditional Artificial Intelligence? (Answer: Algorithms identifying patterns without explicit rules vs broader human mimicry)",
        "AI/ML: What is the difference between Classification and Regression? (Answer: Discrete class labels vs continuous numerical values)",
        "AI/ML: What is the Bias-Variance trade-off? (Answer: High bias/underfitting vs high variance/overfitting on noise)",
        "AI/ML: What is an F1 Score? (Answer: Harmonic mean of Precision and Recall for imbalanced datasets)",
        "AI/ML: What are the different types of Kernels used in SVM? (Answer: Linear, Polynomial, RBF, Sigmoid)",
        "AI/ML: What is a Loss Function and how does it impact model training? (Answer: Measures discrepancy between prediction and actual, minimized via gradient descent)",
        "AI/ML: How do you tackle overfitting? (Answer: More data, cross-validation, L1/L2 regularization, dropout, pruning)",
        "AI/ML: Explain the difference between Narrow AI and General AI. (Answer: Specific single task vs broad human-level intelligence)",
        "AI/ML: What is the difference between Machine Learning and Deep Learning? (Answer: Feature engineering vs multi-layered neural networks auto-extracting features)",
        "AI/ML: What is Generative AI? (Answer: Creating original content by learning structures, e.g., LLMs and diffusion)"
    ],
    "Systems Engineer": [
        "Systems: What do the ACID properties guarantee in database transactions? (Answer: Atomicity, Consistency, Isolation, Durability)",
        "Systems: What is the difference between an INNER JOIN and an OUTER JOIN? (Answer: Matching rows only vs baseline data supplemented by matches/NULLs)",
        "Systems: What is database schema normalization? (Answer: Organizing to reduce redundancy and improve integrity)",
        "Systems: What is the difference between a Primary Key and a Foreign Key? (Answer: Clustered uniqueness vs referential link to another table)",
        "Systems: What is the primary role of an Operating System? (Answer: Intermediary managing CPU, memory, storage, and multitasking)",
        "Systems: What is a system call? (Answer: Controlled request to OS kernel for privileged service)",
        "Systems: What causes 'thrashing' in an operating system? (Answer: Working set exceeds physical memory, constant page faulting)",
        "Systems: What is the main purpose of a subnet mask? (Answer: Divides 32-bit IP into network and host portions)",
        "Systems: Which networking device operates primarily at Layer 2 (Data Link Layer)? (Answer: Network switch using MAC addresses)",
        "Systems: How does the TCP protocol differ from UDP? (Answer: Connection-oriented/reliable vs connectionless/speed)"
    ]
}

def get_questions_for_role(role: str) -> str:
    """Returns a formatted string of questions for the given role, or a generic mix if not found."""
    if role in QUESTIONS_BANK:
        questions = QUESTIONS_BANK[role]
    else:
        # Fallback to Software Engineer
        questions = QUESTIONS_BANK["Software Engineer"]
        
    formatted = "\n".join([f"- {q}" for q in questions])
    return formatted
