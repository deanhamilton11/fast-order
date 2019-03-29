<?php
/**
 * BSS Commerce Co.
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the EULA
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://bsscommerce.com/Bss-Commerce-License.txt
 *
 * =================================================================
 *                 MAGENTO EDITION USAGE NOTICE
 * =================================================================
 * This package designed for Magento COMMUNITY edition
 * BSS Commerce does not guarantee correct work of this extension
 * on any other Magento edition except Magento COMMUNITY edition.
 * BSS Commerce does not provide extension support in case of
 * incorrect edition usage.
 * =================================================================
 *
 * @category   BSS
 * @package    Bss_FastOrder
 * @author     Extension Team
 * @copyright  Copyright (c) 2015-2016 BSS Commerce Co. ( http://bsscommerce.com )
 * @license    http://bsscommerce.com/Bss-Commerce-License.txt
 */
namespace Bss\FastOrder\Model\Search;

use Magento\CatalogInventory\Api\StockRegistryInterface;
use Bss\FastOrder\Helper\PreOrder;

class Save
{
    protected $imageHelper;
    protected $session;
    protected $productRepositoryInterface;
    protected $pricingHelper;
    protected $priceCurrency;
    protected $helperBss;
    private $stockRegistry;
    private $dataTax;

    /**
     * @var PriceCurrencyInterface
     */
    private $bssPreOrder;

    /**
     * @var \Magento\Catalog\Model\ResourceModel\Product\CollectionFactory
     */
    private $_productCollectionFactory;

    protected $resourceModel;

    public function __construct(
        \Magento\Catalog\Model\Product\Attribute\Source\Status $productStatus,
        \Magento\Catalog\Model\Product\Visibility $productVisibility,
        \Magento\Catalog\Api\ProductRepositoryInterface $productRepositoryInterface,
        \Magento\Framework\Pricing\Helper\Data $pricingHelper,
        \Magento\Framework\Pricing\PriceCurrencyInterface $priceCurrency,
        \Magento\Checkout\Model\Session $session,
        \Bss\FastOrder\Helper\Data $helperBss,
        StockRegistryInterface $stockRegistry,
        \Magento\Catalog\Helper\Image $imageHelper,
        \Magento\Tax\Helper\Data $dataTax,
        PreOrder $bssPreOrder,
        \Magento\Catalog\Model\ResourceModel\Product $resourceModel,
        \Magento\Catalog\Model\ResourceModel\Product\CollectionFactory $productCollectionFactory
    ) {
        $this->imageHelper = $imageHelper;
        $this->_productCollectionFactory = $productCollectionFactory;
        $this->productStatus = $productStatus;
        $this->productVisibility = $productVisibility;
        $this->productRepositoryInterface = $productRepositoryInterface;
        $this->session = $session;
        $this->pricingHelper = $pricingHelper;
        $this->priceCurrency = $priceCurrency;
        $this->helperBss = $helperBss;
        $this->stockRegistry = $stockRegistry;
        $this->dataTax = $dataTax;
        $this->bssPreOrder = $bssPreOrder;
        $this->resourceModel = $resourceModel;
    }

    public function getProductInfo($inputRes = null, $csv = null)
    {
        $image = 'category_page_grid';
        $data = [];
        $maxRes = 5;
        if ($this->helperBss->getConfig('max_results_show') > 0) {
            $maxRes = $this->helperBss->getConfig('max_results_show');
        }
        $storeId = $this->helperBss->getStoreId();
        $collection = $this->_productCollectionFactory->create();
        $collection ->addAttributeToSelect('*')
                    ->addStoreFilter($storeId)
                    ->addUrlRewrite()
                    ->addFieldToFilter('status', 1)
                    ->addAttributeToFilter('type_id', ['neq' => 'bundle'])
                    ->setVisibility($this->productVisibility->getVisibleInSiteIds());
        if (!$csv) {
            $exactCollection = $this->_productCollectionFactory->create();
            $exactCollection->addAttributeToSelect('*')
                ->addStoreFilter($storeId)
                ->addUrlRewrite()
                ->addAttributeToFilter('type_id', ['neq' => 'bundle'])
                ->addFieldToFilter('status', 1)
                ->setVisibility($this->productVisibility->getVisibleInSiteIds());
            $exactCollection->addFieldToFilter('name', ['eq' => $inputRes]);
            if ($this->helperBss->getConfig('search_by_sku')) {
                $productId = $this->resourceModel->getIdBySku($inputRes);
                if (!$productId) {
                    $collection ->addAttributeToFilter([
                        ['attribute' => 'sku', 'like' => '%'.$inputRes.'%'],
                        ['attribute' => 'name', 'like' => '%'.$inputRes.'%']
                    ]);
                } elseif (
                    $this->productRepositoryInterface->getById($productId)->getStatus() !=2 &&
                    $this->productRepositoryInterface->getById($productId)->getVisibility() != 1
                ) {
                        $maxRes--;
                        $exactProduct = $this->productRepositoryInterface->getById($productId);
                        $data[] = $this->getExactproductData($exactProduct, $image, $inputRes, $storeId);
                        $collection ->addAttributeToFilter([
                            ['attribute' => 'sku', 'like' => '%'.$inputRes.'%'],
                            ['attribute' => 'name', 'like' => '%'.$inputRes.'%'],
                        ])->addFieldToFilter('sku', ['neq' => $inputRes]);

                        $exactCollection->addFieldToFilter('sku', ['neq' => $inputRes]);
                } else {
                    $collection ->addAttributeToFilter([
                        ['attribute' => 'name', 'like' => '%'.$inputRes.'%']
                    ]);
                }
            } else {
                $collection->addAttributeToFilter('name', ['like' => '%'.$inputRes.'%']);
            }

            $totalExactProductName = count($exactCollection);

            if ($totalExactProductName > 0) {
                $collection->addFieldToFilter('name', ['neq' => $inputRes]);

                $collection->getSelect()->limit($maxRes - $totalExactProductName);
                foreach ($collection as $item) {
                    $exactCollection->addItem($item);
                }

                $collection = $exactCollection;
            } else {
                $collection->getSelect()->limit($maxRes);
            }

        } else {
            $collection->addAttributeToFilter('sku', ['eq' => $inputRes]);
        }

        foreach ($collection as $product) {
            $showPopup = 0;
            $isPreOrder = 0;
            $productSkuHigh = '';
            $productId = $product->getId();
            $productName = $product->getName();
            $productSku = $product->getSku();
            $productUrl = $product->getUrlModel()->getUrl($product);
            $productThumbnail = $this->imageHelper->init($product, $image)->getUrl();
            if ($product->getHasOptions()) {
                $showPopup = 1;
            }
            if ($product->getTypeId() == 'configurable' || $product->getTypeId() == 'grouped') {
                $showPopup = 1;
            }
            if ($product->getTypeId() == 'downloadable' && $product->getTypeInstance()->getLinkSelectionRequired($product)) {
                $showPopup = 1;
            }
            if ($showPopup && $csv) {
                continue;
            }

            if ($this->bssPreOrder->getEnable()) {
                $preOrder = $this->bssPreOrder->getPreOrder($productId);
                $inStock = $this->bssPreOrder->getIsInStock($productId);
                if ($preOrder == 1 || ($preOrder == 2 && $inStock == 0)) {
                    $isPreOrder = 1;
                }
            }

            $finalPriceModel = $product->getPriceInfo()->getPrice('final_price')->getAmount();
            $productPrice = $finalPriceModel->getValue();
            if ($product->getTypeId() == 'configurable') {
                $productTypeInstance = $product->getTypeInstance();
                $productTypeInstance->setStoreFilter($storeId, $product);
                $usedProducts = $productTypeInstance->getUsedProducts($product);
                $tierPrices = $this->getChildrenList($usedProducts);
            } else {
                $tierPrices = [];
                $tierPrices[1]['final_price'] = [$productPrice];
                if ($this->dataTax->displayBothPrices()) {
                    $tierPrices[1]['base_price'] = $finalPriceModel->getBaseAmount();
                }
                $tierPricesList = $product->getPriceInfo()->getPrice('tier_price')->getTierPriceList();

                // add tier price to data
                if (!empty($tierPricesList)) {
                    foreach ($tierPricesList as $tierPrice) {
                        $tierPriceQty = $this->getTierPriceQty($tierPrice['price_qty'], $productId);
                        $tierPrices[$tierPriceQty]['final_price'] = $this->priceCurrency->convert($tierPrice['price']->getValue());
                        if ($this->dataTax->displayBothPrices()) {
                            $tierPrices[$tierPriceQty]['base_price'] = $this->priceCurrency->convert($tierPrice['website_price']);
                        }
                    }
                }
            }

            if ($this->helperBss->getConfig('search_by_sku')) {
                $inputRes = json_encode($inputRes);
                $inputRes = str_replace('\u', '\x', $inputRes);
                if (preg_match('/'.$inputRes.'/i', $productName) || preg_match('/'.$inputRes.'/i', $productSku)) {
                    $pattern = preg_quote($inputRes);
                    $productName = preg_replace("/($pattern)/i", '<span class="bss-highlight">$1</span>', $productName);
                    $productSkuHigh = preg_replace("/($pattern)/i", '<span class="bss-highlight">$1</span>', $productSku);
                }
            } else {
                $inputRes = json_encode($inputRes);
                $inputRes = str_replace('\u', '\x', $inputRes);
                if (preg_match('/'.$inputRes.'/i', $productName)) {
                    $pattern = preg_quote($inputRes);
                    $productName = preg_replace("/($pattern)/i", '<span class="bss-highlight">$1</span>', $productName);
                }
            }
            $validators = [];
            $validators['required-number'] = true;
            $stockItem = $this->stockRegistry->getStockItem(
                $product->getId(),
                $product->getStore()->getWebsiteId()
            );

            $params = [];
            $params['minAllowed']  = max((float)$stockItem->getQtyMinAllowed(), 1);
            if ($stockItem->getQtyMaxAllowed()) {
                $params['maxAllowed'] = $stockItem->getQtyMaxAllowed();
            }
            if ($stockItem->getQtyIncrements() > 0 && $product->getTypeId() != 'grouped') {
                $params['qtyIncrements'] = (float)$stockItem->getQtyIncrements();
            }
            $validators['validate-item-quantity'] = $params;
            $productPriceHtml = $this->pricingHelper->currency($productPrice, true, false);
            $productPriceExcTaxHtml = '';
            $productPriceExcTax = '';
            if ($this->dataTax->displayBothPrices()) {
                $productPriceExcTaxHtml = $this->pricingHelper->currency($finalPriceModel->getValue(\Magento\Tax\Pricing\Adjustment::ADJUSTMENT_CODE), true, false);
                $productPriceExcTax = $this->pricingHelper->currency($finalPriceModel->getValue(\Magento\Tax\Pricing\Adjustment::ADJUSTMENT_CODE), false, false);
            }
            $data[] =  [
                            'product_name'               => $productName,
                            'product_sku'                => $productSku,
                            'product_id'                 => $productId,
                            'product_thumbnail'          => $productThumbnail,
                            'product_url'                => $productUrl,
                            'product_type'               => $product->getTypeId(),
                            'popup'                      => $showPopup,
                            'product_price'              => $productPriceHtml,
                            'tier_price_'.$productId     => $tierPrices,
                            'product_sku_highlight'      => $productSkuHigh,
                            'product_price_amount'       => $productPrice,
                            'data_validate'              => json_encode($validators),
                            'is_qty_decimal'             => (int)$stockItem->getIsQtyDecimal(),
                            'product_price_exc_tax_html' => $productPriceExcTaxHtml,
                            'product_price_exc_tax'      => $productPriceExcTax,
                            'pre_order'                  => $isPreOrder
                        ];
        }
        if (!empty($data)) {
            return json_encode($data);
        } else {
            return false;
        }
    }

    protected function getTierPriceQty($tierPriceQty, $productId)
    {
        $quote = $this->session->getQuote();
        foreach ($quote->getAllVisibleItems() as $item) {
            $productQuote = $this->productRepositoryInterface->get($item->getSku());
            if ($productQuote->getId() == $productId) {
                $tierPriceQty = $tierPriceQty - $item->getQty();
                if ($tierPriceQty < 1) {
                    $tierPriceQty = 1;
                }
            }
        }
        return $tierPriceQty;
    }

    protected function getChildrenList($usedProducts = null)
    {
        if (empty($usedProducts)) {
            return false;
        }
        foreach ($usedProducts as $child) {
            $tierPrices = [];
            $tierPrices[1]['final_price'] = $child->getPriceInfo()->getPrice('final_price')->getAmount()->getValue();
            if ($this->dataTax->displayBothPrices()) {
                $tierPrices[1]['base_price'] = $child->getPriceInfo()->getPrice('final_price')->getAmount()->getBaseAmount();
            }
            $isSaleable = $child->isSaleable();
            if ($isSaleable) {
                $tierPricesList = $child->getPriceInfo()->getPrice('tier_price')->getTierPriceList();
                if (!empty($tierPricesList)) {
                    foreach ($tierPricesList as $tierPrice) {
                        $tierPriceQty = $this->getTierPriceQty($tierPrice['price_qty'], $child->getId());
                        $tierPrices[$tierPriceQty]['final_price'] = $this->priceCurrency->convert($tierPrice['price']->getValue());
                        if ($this->dataTax->displayBothPrices()) {
                            $tierPrices[$tierPriceQty]['base_price'] = $this->priceCurrency->convert($tierPrice['website_price']);
                        }
                    }
                }
            }
            $childrenList['tier_price_child_'.$child->getId()] = $tierPrices;
        }
        return $childrenList;
    }

    protected function getExactproductData($product, $image, $inputRes, $storeId)
    {

        $showPopup = 0;
        $isPreOrder = 0;
        $productSkuHigh = '';
        $productId = $product->getId();
        $productName = $product->getName();
        $productSku = $product->getSku();
        $productUrl = $product->getUrlModel()->getUrl($product);
        $productThumbnail = $this->imageHelper->init($product, $image)->getUrl();
        if ($product->getHasOptions()) {
            $showPopup = 1;
        }
        if ($product->getTypeId() == 'configurable' || $product->getTypeId() == 'grouped') {
            $showPopup = 1;
        }
        if ($product->getTypeId() == 'downloadable' && $product->getTypeInstance()->getLinkSelectionRequired($product)) {
            $showPopup = 1;
        }

        if ($this->bssPreOrder->getEnable()) {
            $preOrder = $this->bssPreOrder->getPreOrder($productId);
            $inStock = $this->bssPreOrder->getIsInStock($productId);
            if ($preOrder == 1 || ($preOrder == 2 && $inStock == 0)) {
                $isPreOrder = 1;
            }
        }

        $finalPriceModel = $product->getPriceInfo()->getPrice('final_price')->getAmount();
        $productPrice = $finalPriceModel->getValue();
        if ($product->getTypeId() == 'configurable') {
            $productTypeInstance = $product->getTypeInstance();
            $productTypeInstance->setStoreFilter($storeId, $product);
            $usedProducts = $productTypeInstance->getUsedProducts($product);
            $tierPrices = $this->getChildrenList($usedProducts);
        } else {
            $tierPrices = [];
            $tierPrices[1]['final_price'] = [$productPrice];
            if ($this->dataTax->displayBothPrices()) {
                $tierPrices[1]['base_price'] = $finalPriceModel->getBaseAmount();
            }
            $tierPricesList = $product->getPriceInfo()->getPrice('tier_price')->getTierPriceList();

            // add tier price to data
            if (!empty($tierPricesList)) {
                foreach ($tierPricesList as $tierPrice) {
                    $tierPriceQty = $this->getTierPriceQty($tierPrice['price_qty'], $productId);
                    $tierPrices[$tierPriceQty]['final_price'] = $this->priceCurrency->convert($tierPrice['price']->getValue());
                    if ($this->dataTax->displayBothPrices()) {
                        $tierPrices[$tierPriceQty]['base_price'] = $this->priceCurrency->convert($tierPrice['website_price']);
                    }
                }
            }
        }

        if ($this->helperBss->getConfig('search_by_sku')) {
            $inputRes = json_encode($inputRes);
            $inputRes = str_replace('\u', '\x', $inputRes);
            if (preg_match('/'.$inputRes.'/i', $productName) || preg_match('/'.$inputRes.'/i', $productSku)) {
                $pattern = preg_quote($inputRes);
                $productName = preg_replace("/($pattern)/i", '<span class="bss-highlight">$1</span>', $productName);
                $productSkuHigh = preg_replace("/($pattern)/i", '<span class="bss-highlight">$1</span>', $productSku);
            }
        } else {
            $inputRes = json_encode($inputRes);
            $inputRes = str_replace('\u', '\x', $inputRes);
            if (preg_match('/'.$inputRes.'/i', $productName)) {
                $pattern = preg_quote($inputRes);
                $productName = preg_replace("/($pattern)/i", '<span class="bss-highlight">$1</span>', $productName);
            }
        }
        $validators = [];
        $validators['required-number'] = true;
        $stockItem = $this->stockRegistry->getStockItem(
            $product->getId(),
            $product->getStore()->getWebsiteId()
        );

        $params = [];
        $params['minAllowed']  = max((float)$stockItem->getQtyMinAllowed(), 1);
        if ($stockItem->getQtyMaxAllowed()) {
            $params['maxAllowed'] = $stockItem->getQtyMaxAllowed();
        }
        if ($stockItem->getQtyIncrements() > 0 && $product->getTypeId() != 'grouped') {
            $params['qtyIncrements'] = (float)$stockItem->getQtyIncrements();
        }
        $validators['validate-item-quantity'] = $params;
        $productPriceHtml = $this->pricingHelper->currency($productPrice, true, false);
        $productPriceExcTaxHtml = '';
        $productPriceExcTax = '';
        if ($this->dataTax->displayBothPrices()) {
            $productPriceExcTaxHtml = $this->pricingHelper->currency($finalPriceModel->getValue(\Magento\Tax\Pricing\Adjustment::ADJUSTMENT_CODE), true, false);
            $productPriceExcTax = $this->pricingHelper->currency($finalPriceModel->getValue(\Magento\Tax\Pricing\Adjustment::ADJUSTMENT_CODE), false, false);
        }
        $productData =  [
            'product_name'               => $productName,
            'product_sku'                => $productSku,
            'product_id'                 => $productId,
            'product_thumbnail'          => $productThumbnail,
            'product_url'                => $productUrl,
            'product_type'               => $product->getTypeId(),
            'popup'                      => $showPopup,
            'product_price'              => $productPriceHtml,
            'tier_price_'.$productId     => $tierPrices,
            'product_sku_highlight'      => $productSkuHigh,
            'product_price_amount'       => $productPrice,
            'data_validate'              => json_encode($validators),
            'is_qty_decimal'             => (int)$stockItem->getIsQtyDecimal(),
            'product_price_exc_tax_html' => $productPriceExcTaxHtml,
            'product_price_exc_tax'      => $productPriceExcTax,
            'pre_order'                  => $isPreOrder
        ];

        return $productData;
    }
}
