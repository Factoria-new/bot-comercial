try:
    import composio_crewai
    print("Available in composio_crewai:", dir(composio_crewai))
except ImportError as e:
    print("Error importing composio_crewai:", e)

try:
    from composio_crewai import ComposioToolSet
    print("ComposioToolSet imported successfully")
except ImportError as e:
    print("Error importing ComposioToolSet:", e)
