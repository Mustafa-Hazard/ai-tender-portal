from sqlalchemy import JSON, Enum
from sqlalchemy.dialects.postgresql import JSONB

# JSONB on PostgreSQL, plain JSON elsewhere (SQLite in tests)
JSONType = JSON().with_variant(JSONB(), "postgresql")


def enum_type(enum_cls):
    """Store enums as short strings (no native DB enum) so migrations stay simple."""
    return Enum(
        enum_cls,
        native_enum=False,
        length=40,
        values_callable=lambda e: [m.value for m in e],
    )
