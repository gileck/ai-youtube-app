# #!/bin/bash

# # Base directory for API routes
# BASE_DIR="/Users/gil/Projects/ai-youtube-app/src/app/api"

# # Function to calculate relative path to apiConfig.ts
# calculate_relative_path() {
#   local route_dir=$(dirname "$1")
#   local rel_path=""
#   local diff_path=${route_dir#$BASE_DIR}
#   local depth=$(echo "$diff_path" | tr -cd '/' | wc -c)
  
#   for ((i=0; i<depth; i++)); do
#     rel_path="../$rel_path"
#   done
  
#   echo "${rel_path}apiConfig"
# }

# # Process each route file
# while IFS= read -r route_file; do
#   rel_path=$(calculate_relative_path "$route_file")
#   echo "Processing $route_file with relative path $rel_path"
  
#   # Check if config is already imported
#   if ! grep -q "import { config } from" "$route_file"; then
#     # Add import statement after the first import
#     sed -i '' "1,/^import/s/^import \(.*\)$/import \1\nimport { config } from '$rel_path';/" "$route_file"
#   fi
  
#   # Check if config is already exported
#   if ! grep -q "export { config }" "$route_file"; then
#     # Add export statement at the end of the file
#     echo -e "\nexport { config };" >> "$route_file"
#   fi
# done < <(find "$BASE_DIR" -name "route.ts")

# echo "All route files updated successfully!"
