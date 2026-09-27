import os
import re

def fuzzy_match_filename(expected, actual_files):
    expected_clean = expected.lower().replace('-', '_').replace('santhali', 'santali').replace('mundri', 'mundari').replace('sauntali', 'santali')
    for f in actual_files:
        f_clean = f.lower().replace('-', '_').replace('santhali', 'santali').replace('mundri', 'mundari').replace('sauntali', 'santali')
        if expected_clean == f_clean:
            return f
    return expected

def fix_file(filepath, base_dir):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    def repl(m):
        path = m.group(1)
        full_path = os.path.join(base_dir, path.lstrip('/'))
        if os.path.exists(full_path):
            return m.group(0)
        
        dir_path = os.path.dirname(full_path)
        filename = os.path.basename(full_path)
        if os.path.exists(dir_path):
            files = os.listdir(dir_path)
            matched_file = fuzzy_match_filename(filename, files)
            new_path = os.path.join(os.path.dirname(path), matched_file).replace('\\', '/')
            return f"'{new_path}'" if m.group(0).startswith("'") else f'"{new_path}"'
        
        return m.group(0)
    
    new_content = re.sub(r'[\'\"](/assets/[^\'\"]+)[\'\"]', repl, content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {filepath}')
    else:
        print(f'No changes needed for {filepath}')

frontend_dir = r'd:\sih_nomination_filling\Samvaad_app\Frontend'
base_dir = os.path.join(frontend_dir, 'public')

fix_file(os.path.join(frontend_dir, 'src', 'data', 'dictionaryData.ts'), base_dir)
fix_file(os.path.join(frontend_dir, 'src', 'context', 'AppContext.tsx'), base_dir)
fix_file(os.path.join(frontend_dir, 'src', 'pages', 'Home.tsx'), base_dir)

fix_file(os.path.join(frontend_dir, 'src', 'pages', 'AnimalFlashcards.tsx'), base_dir)

fix_file(os.path.join(frontend_dir, 'src', 'pages', 'NumbersFlashcards.tsx'), base_dir)

fix_file(os.path.join(frontend_dir, 'src', 'pages', 'Flashcards.tsx'), base_dir)

fix_file(os.path.join(frontend_dir, 'src', 'data', 'animalData.ts'), base_dir)

fix_file(os.path.join(frontend_dir, 'src', 'data', 'numbersData.ts'), base_dir)
