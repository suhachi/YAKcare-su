#!/usr/bin/env python3
"""
프로젝트 전체 코드를 MD 파일로 변환하는 스크립트
"""
import os
import re
from pathlib import Path

# 출력 디렉토리
OUT_DIR = Path("CODE_DOCS")
OUT_DIR.mkdir(exist_ok=True)

# 제외할 디렉토리/파일
EXCLUDE_DIRS = {"node_modules", ".git", "dist", "build", "CODE_DOCS", ".cache", ".cargo", ".vite"}
EXCLUDE_FILES = {".env", ".env.local"}

# 파일 확장자
CODE_EXTENSIONS = {".ts", ".tsx", ".css", ".json", ".sql", ".html", ".js", ".rules", ".toml"}

def sanitize_filename(name):
    """파일명을 안전하게 변환"""
    # 경로 구분자를 언더스코어로
    name = name.replace("\\", "_").replace("/", "_")
    # 특수문자 제거
    name = re.sub(r'[^\w\-_.]', '_', name)
    # 연속 언더스코어 정리
    name = re.sub(r'_+', '_', name)
    return name

def get_language_for_ext(ext):
    """확장자에 따른 언어"""
    lang_map = {
        ".ts": "typescript",
        ".tsx": "tsx",
        ".js": "javascript",
        ".jsx": "jsx",
        ".css": "css",
        ".json": "json",
        ".sql": "sql",
        ".html": "html",
        ".md": "markdown",
    }
    return lang_map.get(ext, "text")

def read_file_content(file_path):
    """파일 내용 읽기"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return f"# 파일 읽기 오류: {e}\n\n"

def create_md_file(rel_path, content):
    """MD 파일 생성"""
    # 파일명 생성
    sanitized = sanitize_filename(rel_path)
    # 확장자 유지하되 .md로 변환
    base_name = sanitized
    if "." in base_name:
        parts = base_name.rsplit(".", 1)
        base_name = f"{parts[0]}_{parts[1]}"
    
    # 순번 추가 (경로 기반)
    parts = rel_path.replace("\\", "/").split("/")
    if len(parts) > 1:
        prefix = f"{len(parts):02d}_"
    else:
        prefix = "99_"
    
    md_filename = f"{prefix}{base_name}.md"
    md_path = OUT_DIR / md_filename
    
    # 확장자 추출
    ext = Path(rel_path).suffix
    lang = get_language_for_ext(ext)
    
    # MD 콘텐츠 생성
    md_content = f"# {rel_path}\n\n"
    md_content += f"**파일 경로**: `{rel_path}`  \n"
    md_content += f"**타입**: {Path(rel_path).suffix[1:].upper() if Path(rel_path).suffix else '파일'}\n\n"
    md_content += "---\n\n"
    md_content += f"```{lang}\n"
    md_content += content
    md_content += "\n```\n\n"
    md_content += "---\n\n"
    md_content += "## 설명\n\n"
    md_content += f"이 파일의 상세 설명은 코드를 참조하세요.\n"
    
    # 파일 쓰기
    try:
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(md_content)
        return True
    except Exception as e:
        print(f"파일 쓰기 오류 {md_path}: {e}")
        return False

def process_file(file_path, root_dir):
    """파일 처리"""
    rel_path = os.path.relpath(file_path, root_dir)
    
    # 제외 파일 체크
    if any(exclude in rel_path for exclude in EXCLUDE_FILES):
        return False
    
    # 확장자 체크
    ext = Path(file_path).suffix
    if ext not in CODE_EXTENSIONS:
        return False
    
    # 파일 읽기
    content = read_file_content(file_path)
    
    # MD 파일 생성
    return create_md_file(rel_path, content)

def main():
    """메인 함수"""
    root_dir = Path(".")
    src_dir = Path("src")
    
    if not src_dir.exists():
        print("src 디렉토리를 찾을 수 없습니다.")
        return
    
    count = 0
    errors = 0
    
    # src 디렉토리 순회
    for root, dirs, files in os.walk(src_dir):
        # 제외 디렉토리 필터링
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            file_path = Path(root) / file
            
            # 제외 파일 체크
            if file in EXCLUDE_FILES:
                continue
            
            # 확장자 체크
            if file_path.suffix not in CODE_EXTENSIONS:
                continue
            
            if process_file(file_path, root_dir):
                count += 1
                if count % 10 == 0:
                    print(f"처리 중... {count}개 파일 완료")
            else:
                errors += 1
    
    # 루트 디렉토리의 파일들도 처리
    for file in ["vite.config.ts", "package.json", "tsconfig.json", "index.html"]:
        file_path = Path(file)
        if file_path.exists():
            if process_file(file_path, root_dir):
                count += 1
            else:
                errors += 1
    
    print(f"\n완료: {count}개 파일 생성, {errors}개 오류")

if __name__ == "__main__":
    main()

