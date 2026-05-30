def moderate_tool_call(tool_name: str, args: dict) -> bool:
    """Return False if the tool call is dangerous, True if safe."""
    dangerous_keywords = ["delete", "rm ", "os.system", "subprocess", "exec(", "import os", "shutil"]
    if tool_name == "calc_tool":
        expr = args.get("expression", "")
        for kw in dangerous_keywords:
            if kw in expr:
                return False
    if tool_name == "db_tool":
        sql = args.get("query", "").lower()
        if "drop" in sql or "delete" in sql:
            return False
    # All other tools are safe
    return True