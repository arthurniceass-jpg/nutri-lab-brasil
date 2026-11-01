"""Modelos do SQLAlchemy.

As tabelas Customer, Product, Order, OrderItem, Coupon e StoreSettings pertencem ao Prisma
(prisma/schema.prisma): aqui só espelhamos as colunas que o Python usa. NÃO crie nem altere
essas tabelas pelo Python. A única tabela do Python é `shaker_stacks`.

Atenção: no Prisma, `@updatedAt` é preenchido pelo cliente (não há DEFAULT no banco), então o
Python precisa preencher `updatedAt` sozinho em INSERT e UPDATE.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Integer, String, Boolean
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

ORDER_STATUS = ("PENDENTE", "PAGO", "ENVIADO", "ENTREGUE", "CANCELADO")


def utcnow() -> datetime:
    # Prisma grava timestamp(3) sem fuso, em UTC.
    return datetime.utcnow()


class Base(DeclarativeBase):
    pass


class Customer(Base):
    __tablename__ = "Customer"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    email: Mapped[str] = mapped_column(String, unique=True)
    passwordHash: Mapped[str] = mapped_column(String)
    cpf: Mapped[str | None] = mapped_column(String, nullable=True)
    cep: Mapped[str | None] = mapped_column(String, nullable=True)
    address: Mapped[str | None] = mapped_column(String, nullable=True)
    number: Mapped[str | None] = mapped_column(String, nullable=True)
    complement: Mapped[str | None] = mapped_column(String, nullable=True)
    neighborhood: Mapped[str | None] = mapped_column(String, nullable=True)
    city: Mapped[str | None] = mapped_column(String, nullable=True)
    state: Mapped[str | None] = mapped_column(String, nullable=True)
    resetToken: Mapped[str | None] = mapped_column(String, nullable=True)
    resetTokenExpiry: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updatedAt: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)


class Product(Base):
    __tablename__ = "Product"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    slug: Mapped[str] = mapped_column(String, unique=True)
    name: Mapped[str] = mapped_column(String)
    category: Mapped[str] = mapped_column(String)
    priceCents: Mapped[int] = mapped_column(Integer)
    image: Mapped[str] = mapped_column(String)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    flavor: Mapped[str | None] = mapped_column(String, nullable=True)
    weight: Mapped[str | None] = mapped_column(String, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    updatedAt: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)


class Order(Base):
    __tablename__ = "Order"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    reference: Mapped[str] = mapped_column(String, unique=True)
    status: Mapped[str] = mapped_column(Enum(*ORDER_STATUS, name="OrderStatus", create_type=False), default="PENDENTE")
    customerName: Mapped[str] = mapped_column(String)
    customerEmail: Mapped[str] = mapped_column(String)
    couponCode: Mapped[str | None] = mapped_column(String, nullable=True)
    totalCents: Mapped[int] = mapped_column(Integer)
    mpPaymentId: Mapped[str | None] = mapped_column(String, nullable=True)
    updatedAt: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)


class OrderItem(Base):
    __tablename__ = "OrderItem"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    orderId: Mapped[str] = mapped_column(String, ForeignKey("Order.id"))
    productId: Mapped[str] = mapped_column(String, ForeignKey("Product.id"))
    quantity: Mapped[int] = mapped_column(Integer)


class Coupon(Base):
    __tablename__ = "Coupon"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    code: Mapped[str] = mapped_column(String, unique=True)
    timesRedeemed: Mapped[int] = mapped_column(Integer, default=0)


class StoreSettings(Base):
    __tablename__ = "StoreSettings"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    storeName: Mapped[str] = mapped_column(String, default="NUTRI LAB BRASIL")
    mpAccessToken: Mapped[str | None] = mapped_column(String, nullable=True)


class ShakerStack(Base):
    """Tabela do Python: stacks do Shaker Lab salvos para compartilhar por link curto."""
    __tablename__ = "shaker_stacks"
    code: Mapped[str] = mapped_column(String(12), primary_key=True)
    items: Mapped[list] = mapped_column(JSON)  # [{"slug": "...", "flavor": "..."}]
    goal: Mapped[str] = mapped_column(String(20))
    name: Mapped[str | None] = mapped_column(String(18), nullable=True)
    customer_id: Mapped[str | None] = mapped_column(String, nullable=True)
    views: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
