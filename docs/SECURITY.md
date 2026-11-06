# SECURITY

## Untrusted inputs
- user text
- LLM output
- URLs
- asset metadata
- imported files

## Rules
- API keys server-side
- strict structured output
- semantic validation
- no `eval`
- no generated executable code
- bounded sizes
- bounded retry
- rate limits
- atomic patch application
- failed plan → no mutation

## Secrets
Never commit API keys, credentials, tokens or secret `.env` values.
