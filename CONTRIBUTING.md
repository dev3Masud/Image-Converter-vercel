# Contributing to ImageConverter

Thank you for your interest in contributing to ImageConverter! We welcome contributions of all forms, including bug reports, documentation updates, feature requests, and code modifications.

## How to Contribute

### 1. Reporting Bugs

If you find a bug, please create a new issue on GitHub. Before submitting, please check if the bug has already been reported. Include the following details:
- A clear description of the bug.
- Steps to reproduce the bug.
- Expected behavior vs. actual behavior.
- Screenshots if relevant.

### 2. Suggesting Features

We welcome new feature requests! Please open an issue and explain:
- The problem this feature will solve.
- Your proposed solution or implementation idea.
- Any alternatives you've considered.

### 3. Submitting Pull Requests

If you want to contribute code to resolve a bug or build a new feature:

1. **Fork the Repository**: Create a fork of this repository on GitHub.
2. **Clone Locally**: Clone your fork to your development machine:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Image-Converter-vercel.git
   cd Image-Converter-vercel
   ```
3. **Set Up Development Environment**: Follow the local development guide in [README.md](README.md) to set up your virtual environment and install backend dependencies.
4. **Create a Branch**: Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. **Implement Changes & Write Tests**: Write clean, standard code. If modifying the Python backend (`api/convert.py`), add relevant regression tests in `tests/test_convert.py`.
6. **Verify and Test**:
   - Run tests using `pytest` to make sure nothing is broken:
     ```bash
     PYTHONPATH=. pytest tests/test_convert.py
     ```
   - Compile code to verify syntax validity:
     ```bash
     python -m py_compile api/convert.py tests/test_convert.py
     ```
   - Check for formatting warnings:
     ```bash
     git diff --check
     ```
7. **Commit & Push**: Commit your changes with clear, descriptive commit messages and push to your fork.
8. **Open a Pull Request**: Go to the original repository on GitHub and open a pull request from your branch.

## Code Style & Standards

- **Python**: Follow PEP 8 guidelines. Keep imports clean and organized.
- **Frontend**: Keep layout components modular, use semantic HTML tags, and apply utility classes using Tailwind CSS.
- **Privacy**: All processing must run securely in memory. Do not persist user-uploaded files.

Thank you for helping us improve ImageConverter!
