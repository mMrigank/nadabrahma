with open('src/components/MasterMixerDrawer.tsx', 'r') as f:
    lines = f.readlines()

with open('new_section_4.tsx', 'r') as f:
    new_lines = f.readlines()

# Convert lines to 0-indexed
start_idx = 447 # Line 448
end_idx = 502 # Line 502

lines_before = lines[:start_idx]
lines_after = lines[end_idx:]

with open('src/components/MasterMixerDrawer.tsx', 'w') as f:
    f.writelines(lines_before)
    f.writelines(new_lines)
    f.writelines(lines_after)
