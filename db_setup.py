import sqlite3

conn = sqlite3.connect("papers.db")
c = conn.cursor()
c.execute("""CREATE TABLE IF NOT EXISTS papers
             (id INTEGER PRIMARY KEY, title TEXT, authors TEXT, year INTEGER, citations INTEGER, bibtex TEXT)""")

papers = [
    ("Graph Neural Networks: A Review", "Jie Zhou et al.", 2020, 5432, "@article{zhou2020graph, title={Graph Neural Networks}, author={Zhou, Jie}, year={2020}}"),
    ("Attention Is All You Need", "Vaswani et al.", 2017, 98765, "@article{vaswani2017attention, title={Attention Is All You Need}, author={Vaswani}, year={2017}}"),
    ("BERT: Pre-training of Deep Bidirectional Transformers", "Devlin et al.", 2019, 87654, "@article{devlin2019bert, title={BERT}, author={Devlin}, year={2019}}"),
]
c.executemany("INSERT INTO papers (title, authors, year, citations, bibtex) VALUES (?,?,?,?,?)", papers)
conn.commit()
conn.close()
print("Database ready.")