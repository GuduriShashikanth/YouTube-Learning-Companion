"""LLM service for interacting with language models via LangChain."""

from langchain_core.messages import HumanMessage, SystemMessage

from app.core.config import get_settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)


class LLMService:
    """Service for generating text responses using LLM providers."""

    def __init__(self) -> None:
        settings = get_settings()
        self.provider = settings.LLM_PROVIDER

        if self.provider == "gemini":
            from langchain_google_genai import ChatGoogleGenerativeAI

            self.llm = ChatGoogleGenerativeAI(
                model=settings.GEMINI_MODEL,
                google_api_key=settings.GEMINI_API_KEY,
                temperature=0.3,
                convert_system_message_to_human=True,
            )
            logger.info(f"Initialized Gemini LLM with model: {settings.GEMINI_MODEL}")
        elif self.provider == "openai":
            from langchain_openai import ChatOpenAI

            self.llm = ChatOpenAI(
                model=settings.OPENAI_MODEL,
                api_key=settings.OPENAI_API_KEY,
                temperature=0.3,
            )
            logger.info(f"Initialized OpenAI LLM with model: {settings.OPENAI_MODEL}")
        elif self.provider == "groq":
            from langchain_groq import ChatGroq

            self.llm = ChatGroq(
                model=settings.GROQ_MODEL,
                api_key=settings.GROQ_API_KEY,
                temperature=0.3,
            )
            logger.info(f"Initialized Groq LLM with model: {settings.GROQ_MODEL}")
        else:
            raise ValueError(
                f"Unsupported LLM provider: {self.provider!r}. "
                "Valid options are: 'gemini', 'openai', 'groq'."
            )

    async def generate(self, prompt: str) -> str:
        """Generate a response from the LLM given a prompt.

        Args:
            prompt: The user prompt to send to the LLM.

        Returns:
            The generated text response.
        """
        try:
            messages = [HumanMessage(content=prompt)]
            response = await self.llm.ainvoke(messages)
            return response.content
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            raise

    async def generate_structured(
        self, prompt: str, system_prompt: str = ""
    ) -> str:
        """Generate a response with an optional system message.

        Args:
            prompt: The user prompt to send to the LLM.
            system_prompt: An optional system-level instruction.

        Returns:
            The generated text response.
        """
        try:
            messages = []
            if system_prompt:
                messages.append(SystemMessage(content=system_prompt))
            messages.append(HumanMessage(content=prompt))
            response = await self.llm.ainvoke(messages)
            return response.content
        except Exception as e:
            logger.error(f"LLM structured generation failed: {e}")
            raise


# Module-level singleton (reset on each worker restart / uvicorn reload)
_llm_service: LLMService | None = None


def get_llm_service() -> LLMService:
    """Get or create the singleton LLM service instance.

    The singleton is scoped to the current worker process lifetime,
    so uvicorn --reload will always create a fresh instance with
    the latest .env settings.
    """
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service


def reset_llm_service() -> None:
    """Force recreation of the LLM service on next call (useful in tests)."""
    global _llm_service
    _llm_service = None
