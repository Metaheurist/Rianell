# git filter-repo --message-callback body (file): strip Cursor co-author + Made-with trailer
# See: https://github.com/newren/git-filter-repo/blob/main/Documentation/git-filter-repo.txt
return b"\n".join(
    [
        l
        for l in message.replace(b"\r\n", b"\n").split(b"\n")
        if not (
            (b"Co-authored-by:" in l and b"cursoragent@cursor.com" in l)
            or (l.strip() == b"Made-with: Cursor")
        )
    ]
)
