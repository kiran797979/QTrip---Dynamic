import sys
import os
import logging
import tempfile
import shutil
import datetime

# Set up logging
timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
if not os.path.exists('__CRIO__/merge_drivers/logs'):
    os.makedirs('__CRIO__/merge_drivers/logs')
log_file_path = os.path.join('__CRIO__/merge_drivers/logs', f'autoselect_nonempty_logs-{timestamp}.log')
logging.basicConfig(filename=log_file_path, level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def is_non_empty(section):
    """Check if the section contains any non-whitespace content."""
    for line in section:
        if line.strip():
            return True
    return False

def process_conflict(ours, theirs):
    """Determine which conflict section to keep based on non-empty status.
    If both sections are non-empty, return None to preserve the conflict."""
    ours_nonempty = is_non_empty(ours)
    theirs_nonempty = is_non_empty(theirs)
    
    if ours_nonempty and theirs_nonempty:
        return None, None  # Signal to preserve the original conflict
    elif ours_nonempty:
        return ours, 'ours'
    elif theirs_nonempty:
        return theirs, 'theirs'
    else:
        return [], None

def main():
    if len(sys.argv) != 4:
        logging.error("Usage: autoselect_nonempty.py <merged-file> <output-file> <path>")
        sys.exit(1)

    merged_file = sys.argv[1]
    output_file = sys.argv[2]
    path=sys.argv[3]

    logging.info(f"Processing file: {path}")
    autoselect_count = 0

    # Guardrail: Check merged file existence and readability
    if not os.path.isfile(merged_file):
        logging.error(f"Merged file does not exist: {merged_file}")
        sys.exit(1)

    if not os.access(merged_file, os.R_OK):
        logging.error(f"Merged file is not readable: {merged_file}")
        sys.exit(1)

    # Guardrail: Ensure output file does not already exist
    # if os.path.exists(output_file):
    #     logging.error(f"Output file already exists: {output_file}. Refusing to overwrite.")
    #     sys.exit(1)

    # Guardrail: Check if the directory for the output file exists and is writable
    output_dir = os.path.dirname(output_file) or '.'
    if not os.path.isdir(output_dir):
        logging.error(f"Output directory does not exist: {output_dir}")
        sys.exit(1)
    if not os.access(output_dir, os.W_OK):
        logging.error(f"Output directory is not writable: {output_dir}")
        sys.exit(1)

    # Read merged content safely
    try:
        with open(merged_file, 'r') as f:
            lines = f.readlines()
            
    except Exception as e:
        logging.error(f"Failed to read merged file: {merged_file}. Error: {e}")
        sys.exit(1)

    output = []
    state = 'out'  # States: out, in_ours, in_base, in_theirs
    current_ours = []
    current_theirs = []
    conflict_count = 0

    for line in lines:
        # logging.info(f"Processing, state: {state} | line: {line}")
        if state == 'out':
            if line.startswith('<<<<<<< ours'):
                # Start of conflict
                state = 'in_ours'
                # logging.info(f"State changed to: {state}")
                current_ours = []
                current_theirs = []
            else:
                output.append(line)
        
        elif state == 'in_ours':
            if line.startswith('||||||| base'):
                state = 'in_base'
            elif line.startswith('======'):
                state = 'in_theirs'
            else:
                # Guardrail: Prevent nested conflict start markers
                if line.startswith('<<<<<<<'):
                    logging.error("Encountered nested conflict marker in 'ours' section. Aborting.")
                    sys.exit(1)
                current_ours.append(line)
        
        elif state == 'in_base':
            if line.startswith('======'):
                state = 'in_theirs'
                # logging.info(f"State changed to: {state}")
        
        elif state == 'in_theirs':
            if line.startswith('>>>>>>> theirs'):
                # End of conflict - process sections
                selected, source = process_conflict(current_ours, current_theirs)
                if selected is None:
                    # Preserve the original conflict
                    output.append('<<<<<<< ours\n')
                    output.extend(current_ours)
                    output.append('=======\n')
                    output.extend(current_theirs)
                    output.append('>>>>>>> theirs\n')
                else:
                    output.extend(selected)
                    if source:  # If autoselection happened
                        autoselect_count += 1
                        logging.info(f"Autoselected '{source}' section in conflict #{conflict_count + 1}:")
                        logging.info("Selected content:")
                        for line in selected:
                            logging.info(f"  {line.rstrip()}")
                conflict_count += 1
                state = 'out'
            else:
                current_theirs.append(line)
        else:
            logging.error(f"Unknown state encountered: {state}")
            sys.exit(1)

    # Guardrail: Ensure file ended with a complete conflict (state must be 'out')
    if state != 'out':
        logging.error("File ended unexpectedly with an incomplete conflict marker")
        sys.exit(1)

    # Guardrail: Check that at least one conflict was processed
    if conflict_count == 0:
        logging.error("No conflict markers found in merged file. Aborting to avoid unintended changes.")
        sys.exit(1)

    # Log final statistics
    logging.info(f"Total conflicts processed: {conflict_count}")
    logging.info(f"Total autoselections made: {autoselect_count}")

    # Write resolved content to a temporary file, then atomically move it to output_file
    temp_fd, temp_path = tempfile.mkstemp(dir=output_dir, text=True)
    try:
        with os.fdopen(temp_fd, 'w') as temp_file:
            temp_file.writelines(output)
        # Atomically move the temp file to the desired output file
        shutil.move(temp_path, output_file)
        logging.info(f"Resolved content written to: {output_file}")
    except Exception as e:
        # Clean up temporary file if an error occurs
        if os.path.exists(temp_path):
            os.remove(temp_path)
        logging.error(f"Failed to write to output file: {output_file}. Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
