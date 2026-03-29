#!/usr/bin/env python3
"""
Script to add trailing slashes to all FastAPI route decorators with path parameters
"""

import os
import re
from pathlib import Path

def fix_route_file(filepath):
    """Add trailing slashes to routes with path parameters"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to match route decorators with path parameters but no trailing slash
    # Examples: @router.get("/{id}") -> @router.get("/{id}/")
    pattern = r'(@router\.(get|post|put|delete|patch)\("[^"]*\{[^}]+\})"(\))'
    replacement = r'\1/"\3'
    
    # Apply the replacement
    new_content = re.sub(pattern, replacement, content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def main():
    routes_dir = Path(__file__).parent / 'app' / 'api' / 'routes'
    
    if not routes_dir.exists():
        print(f"Routes directory not found: {routes_dir}")
        return
    
    updated_files = []
    for route_file in routes_dir.glob('*.py'):
        if route_file.name == '__init__.py':
            continue
        
        if fix_route_file(route_file):
            updated_files.append(route_file.name)
            print(f"✓ Updated: {route_file.name}")
        else:
            print(f"  Skipped: {route_file.name} (no changes needed)")
    
    if updated_files:
        print(f"\n✅ Successfully updated {len(updated_files)} files")
    else:
        print("\n✅ All files already have correct trailing slashes")

if __name__ == "__main__":
    main()
