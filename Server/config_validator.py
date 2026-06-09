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


def generate_default_env_template(filepath: str = ".env.generated"):
    """
    Creates a template env file with pre-populated dummy security tokens for local testing.
    """
    template = (
        "# FORENSIC PRO SUITE AUTO-GENERATED TEMPLATE\n"
        "SUPABASE_URL=https://placeholder-project-id.supabase.co\n"
        "SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder\n"
        "ADMIN_TOKEN=forensic-admin-super-token-12345\n"
        "INVESTIGATOR_TOKEN=forensic-investigator-secure-token-56789\n"
        "ANALYZE_API_KEY=forensic-pro-suite-demo-analyze-key\n"
    )
    with open(filepath, "w") as f:
        f.write(template)
    logger.info(f"Successfully generated clean environment template at: {filepath}")
