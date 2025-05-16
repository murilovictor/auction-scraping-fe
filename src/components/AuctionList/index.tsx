"use client";

import React, { useState } from "react";
import useSWR from "swr";
import {
  Avatar,
  getKeyValue,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import FilterBar from "@/components/FilterBar";

const fetcher = (url: string) =>
  fetch(url).then(async (res: any) => {
    return res.json();
  });

export default function PropertiesList() {
  const [page, setPage] = useState(1);

  // Novo estado para a query string dos filtros
  const [filterQuery, setFilterQuery] = useState("");

  // Build query string from applied filters (mantém paginação)
  const query = new URLSearchParams({
    page: String(page),
    limit: "10",
  }).toString();

  // Usa a query do filtro junto com paginação
  const { data, isLoading } = useSWR(
    `http://localhost:3009/api/properties?${query}&${filterQuery}`,
    fetcher,
    {
      keepPreviousData: true,
    },
  );

  const properties = data?.data ?? [];
  const totalPages = data?.meta?.pages ?? 0;

  const loadingState = isLoading || data?.length === 0 ? "loading" : "idle";

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatPercent = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "percent",
      minimumFractionDigits: 2,
    }).format(value);


  // Atualiza a query string dos filtros ao aplicar
  const handleApply = (qs: string) => {
    setFilterQuery(qs);
    setPage(1); // volta para a primeira página ao filtrar
  };

  return (
    <div className="w-full p-6">
      {/* Filtro */}
      <FilterBar onApply={handleApply} />

      {/* Table */}
      <div className="w-full overflow-auto">
        <Table
          isStriped={true}
          selectionMode="single"
          color="primary"
          maxTableHeight={500}
          rowHeight={70}
          bottomContent={
            totalPages > 1 ? (
              <div className="mt-4 flex justify-center">
                <Pagination
                  isCompact
                  showControls
                  showShadow
                  color="primary"
                  page={page}
                  total={totalPages}
                  onChange={(page) => setPage(page)}
                />
              </div>
            ) : null
          }
        >
          <TableHeader>
            <TableColumn key="photo">Foto</TableColumn>
            <TableColumn key="appraisalValue">Valor Avaliação</TableColumn>
            <TableColumn key="firstSaleDate">Data 1ª Venda</TableColumn>
            <TableColumn key="firstSalePrice">Preço 1ª Venda</TableColumn>
            <TableColumn key="firstSaleDiscountPercent">
              % Desc. 1ª Venda
            </TableColumn>
            <TableColumn key="secondSaleDate">Data 2ª Venda</TableColumn>
            <TableColumn key="secondSalePrice">Preço 2ª Venda</TableColumn>
            <TableColumn key="secondSaleDiscountPercent">
              % Desc. 2ª Venda
            </TableColumn>
            <TableColumn key="city">Cidade</TableColumn>
            <TableColumn key="state">Estado</TableColumn>
            <TableColumn key="neighborhood">Bairro</TableColumn>
          </TableHeader>
          <TableBody
            items={properties ?? []}
            loadingContent={<Spinner />}
            loadingState={loadingState}
          >
            {(item: any) => (
              <TableRow key={item.id}>
                {(columnKey) => {
                  const rawValue = getKeyValue(item, columnKey);
                  // Date fields
                  if (
                    columnKey === "firstSaleDate" ||
                    columnKey === "secondSaleDate"
                  ) {
                    return (
                      <TableCell>
                        {new Date(rawValue).toLocaleDateString("pt-BR")}
                      </TableCell>
                    );
                  }
                  // Currency fields
                  if (
                    columnKey === "firstSalePrice" ||
                    columnKey === "secondSalePrice" ||
                    columnKey === "appraisalValue"
                  ) {
                    return (
                      <TableCell>{formatCurrency(Number(rawValue))}</TableCell>
                    );
                  }
                  // Percent fields
                  if (
                    columnKey === "firstSaleDiscountPercent" ||
                    columnKey === "secondSaleDiscountPercent"
                  ) {
                    // rawValue comes as number percentage (e.g., 10.5), convert to fraction
                    return (
                      <TableCell>
                        {formatPercent(Number(rawValue) / 100)}
                      </TableCell>
                    );
                  }

                  if (columnKey === "photo") {
                    return (
                      <TableCell>
                        <Avatar
                          radius="sm"
                          isBordered={true}
                          className="h-20 w-20 text-large"
                          src={rawValue}
                        />
                      </TableCell>
                    );
                  }

                  // Default
                  return <TableCell>{rawValue}</TableCell>;
                }}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
