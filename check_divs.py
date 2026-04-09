import re

with open('src/components/EditorPanel.tsx', 'r') as f:
    content = f.read()

stack = []
for i, line in enumerate(content.split('\n')):
    # This is a simple regex, it might not be perfect for all cases (like <div />)
    if re.search(r'<div\b', line) and not re.search(r'/>', line):
        stack.append(i + 1)
    if re.search(r'</div', line):
        if stack:
            stack.pop()
        else:
            print(f"Unmatched closing div at line {i + 1}")

for line_num in stack:
    print(f"Unmatched opening div at line {line_num}")
