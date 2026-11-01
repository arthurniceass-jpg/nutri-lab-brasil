import pytest

from app.models import Product, utcnow


@pytest.fixture()
def catalogo(db_session):
    now = utcnow()
    rows = [
        ("w1", "whey-a", "Whey A", "PROTEINAS", 9000, "Natural, Chocolate e Baunilha", True),
        ("w2", "whey-b", "Whey B", "PROTEINAS", 7000, "Baunilha", True),
        ("c1", "creatina-a", "Creatina A", "CREATINA", 6000, None, True),
        ("p1", "pre-a", "Pré A", "PRE_TREINO", 5000, None, True),
        ("k1", "combo-x", "Combo Whey + Creatina", "PROTEINAS", 12000, None, True),
        ("o1", "whey-off", "Whey Fora de Linha", "PROTEINAS", 8000, None, False),
    ]
    for pid, slug, name, cat, price, flavor, active in rows:
        db_session.add(Product(id=pid, slug=slug, name=name, category=cat, priceCents=price, image=f"/products/{slug}.webp",
                               stock=5, flavor=flavor, weight="1 kg", active=active, updatedAt=now))
    db_session.commit()
    return db_session


def make(client, items, goal="massa", name=None):
    return client.post("/api/shaker/stacks", json={"items": items, "goal": goal, "name": name})


def test_create_and_read_stack(client, catalogo):
    r = make(client, [{"slug": "whey-a", "flavor": "Chocolate"}, {"slug": "creatina-a"}], name="Arthur")
    assert r.status_code == 200
    code = r.json()["code"]
    assert len(code) == 8 and r.json()["url"].endswith(f"/shaker?c={code}")

    got = client.get(f"/api/shaker/stacks/{code}")
    assert got.status_code == 200
    data = got.json()
    assert data["name"] == "Arthur" and data["goal"] == "massa"
    assert [i["slug"] for i in data["items"]] == ["whey-a", "creatina-a"]
    assert data["items"][0]["chosenFlavor"] == "Chocolate" and data["items"][0]["priceCents"] == 9000
    assert "costCents" not in data["items"][0]  # nunca expõe custo


def test_unknown_flavor_is_dropped(client, catalogo):
    code = make(client, [{"slug": "whey-a", "flavor": "Sabor Inventado"}]).json()["code"]
    assert client.get(f"/api/shaker/stacks/{code}").json()["items"][0]["chosenFlavor"] == ""


@pytest.mark.parametrize("items,goal", [
    ([], "massa"),
    ([{"slug": "whey-a"}, {"slug": "whey-b"}], "massa"),  # dois do mesmo tipo
    ([{"slug": "combo-x"}], "massa"),  # combo não entra
    ([{"slug": "whey-off"}], "massa"),  # produto desativado
    ([{"slug": "nao-existe"}], "massa"),
    ([{"slug": "whey-a"}, {"slug": "creatina-a"}, {"slug": "pre-a"}, {"slug": "whey-b"}], "massa"),  # mais de 3
    ([{"slug": "whey-a"}], "objetivo-falso"),
    (["texto"], "massa"),
    ([{"slug": ""}], "massa"),
])
def test_invalid_stacks_are_rejected(client, catalogo, items, goal):
    assert make(client, items, goal).status_code == 400


def test_bad_or_missing_codes_are_404(client, catalogo):
    assert client.get("/api/shaker/stacks/zzzzzzzz").status_code == 404  # bem formado, não existe
    for bad in ["x", "AAAAAAAA", "../etc", "a'b", "0000000o"]:
        assert client.get(f"/api/shaker/stacks/{bad}").status_code == 404


def test_name_is_trimmed_and_cleaned(client, catalogo):
    code = make(client, [{"slug": "pre-a"}], name="  \x00Arthur Niceas Silva Pereira  ").json()["code"]
    name = client.get(f"/api/shaker/stacks/{code}").json()["name"]
    assert name == "Arthur Niceas Silv" and len(name) <= 18


def test_creation_is_rate_limited(client, catalogo):
    codes = [make(client, [{"slug": "pre-a"}]).status_code for _ in range(32)]
    assert codes[:30] == [200] * 30 and codes[30:] == [429, 429]
