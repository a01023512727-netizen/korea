import re
import ssl
import urllib.request
from pathlib import Path

post_id = "16941"
ctx = ssl.create_default_context()
page = urllib.request.urlopen(
    f"https://www.gunsys.com/tn/board.php?board=informationboard&category=5&command=body&no={post_id}",
    context=ctx,
).read().decode("utf-8", "ignore")
out = Path(__file__).parent / "answer-keys"
out.mkdir(exist_ok=True)
imgs = re.findall(r"https://gunsys\.com/tn/data/board/informationboard/file_in_body/[^\"']+", page)
for i, url in enumerate(imgs):
    data = urllib.request.urlopen(url, context=ctx).read()
    dest = out / f"16941-{i}.jpg"
    dest.write_bytes(data)
    print(dest.name, len(data))
