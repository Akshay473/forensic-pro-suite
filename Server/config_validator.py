import os
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ConfigValidator")

REQUIRED_ENV_VARS = {
    "SUPABASE_URL": "Required to query database case records and render evidence graphs.",
    "SUPABASE_ANON_KEY": "Required to authenticate database client connections securely.",
    "ADMIN_TOKEN": "Required to authorize administration workflows (e.g. stats, reports).",
    "INVESTIGATOR_TOKEN": "Required to validate forensic investigator operations."
}

def validate_environment():
    """Verify presence of critical environment variables and print clean diagnostic logs."""
    missing_vars = []
    
    print("\n" + "="*70)
    print("      FORENSIC PRO SUITE - BACKEND BOOTSTRAP ENVIRONMENT SCAN")
    print("="*70)
    
    for var, description in REQUIRED_ENV_VARS.items():
        value = os.getenv(var)
        if not value:
            missing_vars.append((var, description))
            status = " [ MISSING ] "
        else:
            # Mask token values for security
            masked_value = value[:4] + "*"*8 if len(value) > 4 else "*"*8
            status = f" [ OK ] - {masked_value}"
        print(f" -> {var:<22} {status}")
        
    print("="*70)
    
    if missing_vars:
        print("\n" + "!"*70)
        print("  WARNING: Configuration validation found missing required env keys:")
        for var, description in missing_vars:
            print(f"  * {var}: {description}")
        print("  Ensure you copy .env.example to .env and configure these parameters.")
        print("!"*70 + "\n")
        
        # We will log a warning but allow local running for development fallback modes.
        logger.warning("Server is starting up with incomplete environment variable settings.")
    else:
        logger.info("All core infrastructure environment configurations validated successfully.")
    print("="*70 + "\n")

if __name__ == "__main__":
    validate_environment()
