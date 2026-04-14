import chromadb
from openai import AsyncOpenAI
from app.config import get_settings

settings = get_settings()

# ==========================================
# 1. GLOBAL CLIENT SETUP
# ==========================================
chroma_client = chromadb.CloudClient(
    api_key=settings.chromadb_api_key,
    tenant=settings.chromadb_tenant,
    database=settings.chromadb_database
)
collection = chroma_client.get_collection(name="personal-finance-help")

ai_client = AsyncOpenAI(
    api_key=settings.ai_api_key,
    base_url=settings.ai_base_url
)

# ==========================================
# 2. MODULAR AI CALLER (With Error Handling)
# ==========================================
async def call_arkvion_ai(system_prompt: str, user_message: str):
    """
    Handles the actual communication with the LLM.
    Separating this allows for better logging and error catching.
    """
    try:
        response = await ai_client.chat.completions.create(
            model=settings.model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.1 # Low temperature for consistent financial advice
        )
        return response.choices[0].message.content

    except Exception as e:
        # Log the error for debugging
        print(f"ARKVION AI ERROR: {str(e)}")
        return "I'm having trouble connecting to my brain right now. Please try again in a moment!"

# ==========================================
# 3. MAIN GENERATION FUNCTION
# ==========================================
async def generate_ai_response(
    user, 
    message: str, 
    current_page: str ,
    income_service, 
    expense_service, 
    subscription_service
) -> str:
    
    # --- A. User Identity ---
    user_id = user.id
    user_name = getattr(user, 'username', getattr(user, 'first_name', 'Valued User')) 
    
    # --- B. Documentation Retrieval (ChromaDB) ---
    results = collection.query(query_texts=[message], n_results=1)
    doc_context = ""
    if results and "documents" in results and results["documents"][0]:
        doc_context = results["documents"][0][0]

    # --- C. Financial Data Processing ---
    
    incomes = income_service.get_user_income(user_id)
    expenses = expense_service.get_user_expenses(user_id)
    subscriptions = subscription_service.get_user_subscriptions(user_id)
    
    
    total_income = sum(i.amount for i in incomes)
    total_expenses = sum(e.amount for e in expenses)
    total_subs = sum(s.monthly_equivalent for s in subscriptions)
    balance = total_income - total_expenses

    # --- D. Logic-Based Alerts ---
    alerts = []
    if total_expenses > total_income:
        alerts.append("⚠️ Overspending: Expenses exceed income.")
    if total_income > 0 and (total_subs / total_income) > 0.2:
        alerts.append("🚩 High Subscriptions: Consuming >20% of income.")
    if total_income > 0 and (total_expenses / total_income) > 0.8:
        alerts.append("💡 High Burn Rate: Spending is over 80% of earnings.")
    
    alerts_text = "\n".join(alerts) if alerts else "Financial standing is stable."

    # --- E. System Prompt Construction ---
    system_prompt = f"""Role: Arkvion Assistant. Tone: Concise, practical, and encouraging.

    [USER & SYSTEM CONTEXT]
    Name: {user.username}
    Current Page: {current_page}
    Alerts: {alerts_text}

    [FINANCIAL DATA]
    Current Balance: ${balance:,.2f}
    Total Income: ${total_income:,.2f}
    Total Expenses: ${total_expenses:,.2f} (Includes ${total_subs:,.2f} in subscriptions)

    [DOCUMENTATION]
    {doc_context}

    [INSTRUCTIONS]
    1. Address the user by name occasionally.
    2. If Alerts are present, briefly mention them as priorities.
    3. Use the [DOCUMENTATION] context to answer specific "How-to" questions.
    4. If the user asks "What is this page?" or "How do I use this?", specifically refer to the documentation for the '{current_page}' section.
    """

    # --- F. Execute ---
    return await call_arkvion_ai(system_prompt, message)