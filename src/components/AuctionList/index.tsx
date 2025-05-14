"use client";

import React, { useCallback, useState } from "react";
import useSWR from "swr";
import {
  Button,
  getKeyValue,
  Select,
  SelectItem,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { User } from "@heroui/user";

const fetcher = (url: string) =>
  fetch(url).then(async (res: any) => {
    return res.json();
  });

export default function PropertiesList() {
  const [page, setPage] = useState(1);
  // UI-controlled inputs
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [propertyType, setPropertyType] = useState("");
  // Applied filters
  const [appliedRange, setAppliedRange] = useState<[number, number]>([
    0, 5000000,
  ]);
  const [appliedType, setAppliedType] = useState("");

  // Build query string from applied filters
  const query = new URLSearchParams({
    page: String(page),
    limit: "10",
    minPrice: String(appliedRange[0]),
    maxPrice: String(appliedRange[1]),
    ...(appliedType && { propertyType: appliedType }),
  }).toString();

  const { data, isLoading } = useSWR(
    `http://localhost:3009/api/properties?${query}&propertyType=Casa`,
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

  const applyFilters = useCallback(() => {
    setAppliedRange(priceRange);
    setAppliedType(propertyType);
    setPage(1);
  }, [priceRange, propertyType]);

  return (
    <div className="w-full p-6">
      {/* Filter Form */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-6">
            <div>
              <label htmlFor="priceRange" className="block text-sm font-medium">
                Preço: {formatCurrency(priceRange[0])} –{" "}
                {formatCurrency(priceRange[1])}
              </label>
              <Slider
                id="priceRange"
                formatOptions={{ style: "currency", currency: "BRA" }}
                maxValue={1000000}
                minValue={0}
                step={20000}
                value={priceRange}
                onChange={(value) => setPriceRange(value as [number, number])}
                className="max-w-md"
              />
            </div>

            <div className="lg:col-span-4">
              <label htmlFor="typeFilter" className="block text-sm font-medium">
                Tipo de imóvel
              </label>
              <Select
                className="max-w-xs"
                label="property type"
                onChange={(e) => setPropertyType(e.target.value)}
              >
                <SelectItem key="Casa">Casa</SelectItem>
                <SelectItem key="Apartamento">Apartamento</SelectItem>
                <SelectItem key="Terreno">Terreno</SelectItem>
              </Select>

              <div className="lg:col-span-2 flex justify-end">
                <Button onClick={applyFilters} className="mt-1" color="primary">
                  Filtrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                        <User
                          avatarProps={{ radius: "lg", src: rawValue }}
                          description={item?.identification}
                          name={item?.type}
                        ></User>
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
