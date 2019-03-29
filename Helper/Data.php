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
namespace Bss\FastOrder\Helper;

class Data extends \Magento\Framework\App\Helper\AbstractHelper
{
    const XML_PATH_REDIRECT_TO_CART = 'checkout/cart/redirect_to_cart';

    protected $scopeConfig;
    protected $priceCurrency;
    protected $eventManager;
    protected $jsonEncoder;
    protected $localeFormat;
    protected $imageHelper;
    protected $customerSession;
    protected $responseObject;
    protected $storeManager;

    public function __construct(
        \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig,
        \Magento\Framework\Pricing\PriceCurrencyInterface $priceCurrency,
        \Magento\Framework\Event\ManagerInterface $eventManager,
        \Magento\Framework\Locale\FormatInterface $localeFormat,
        \Magento\Catalog\Helper\Image $imageHelper,
        \Magento\Customer\Model\SessionFactory $customerSession,
        \Magento\Framework\Json\EncoderInterface $jsonEncoder,
        \Magento\Store\Model\StoreManagerInterface $storeManager,
        \Magento\Framework\DataObject $responseObject
    ) {
        $this->scopeConfig = $scopeConfig;
        $this->localeFormat = $localeFormat;
        $this->imageHelper = $imageHelper;
        $this->priceCurrency = $priceCurrency;
        $this->eventManager = $eventManager;
        $this->jsonEncoder = $jsonEncoder;
        $this->customerSession = $customerSession;
        $this->responseObject = $responseObject;
        $this->storeManager = $storeManager;
    }

    public function getConfig($config_path = '')
    {
        if ($this->scopeConfig->getValue('fastorder/general/enabled', \Magento\Store\Model\ScopeInterface::SCOPE_STORE) && $this->checkCustomer()) {
            return $this->scopeConfig->getValue('fastorder/general/'.$config_path, \Magento\Store\Model\ScopeInterface::SCOPE_STORE);
        }
        return false;
    }

    public function getFomatPrice()
    {
        $config = $this->localeFormat->getPriceFormat();
        return $this->jsonEncoder->encode($config);
    }

    public function checkCustomer()
    {
        $customerConfig = $this->scopeConfig->getValue('fastorder/general/active_customer_groups', \Magento\Store\Model\ScopeInterface::SCOPE_STORE);
        if ($customerConfig != '') {
            $customerConfigArr = explode(',', $customerConfig);
            if ($this->customerSession->create()->isLoggedIn()) {
                $customerGroupId = $this->customerSession->create()->getCustomerGroupId();
                if (in_array($customerGroupId, $customerConfigArr)) {
                    return true;
                }
            } else {
                if (in_array(0, $customerConfigArr)) {
                    return true;
                }
            }
        }
        return false;
    }

    public function getUrlShortcut()
    {
        if ($this->getConfig('cms_url_key')) {
            return $this->getConfig('cms_url_key');
        }
        return false;
    }

    public function getJsonConfigPrice($product)
    {
        if (!$product->hasOptions()) {
            $config = [
                'productId' => $product->getId(),
                'priceFormat' => $this->localeFormat->getPriceFormat()
                ];
            return $this->jsonEncoder->encode($config);
        }

        $tierPrices = [];
        $tierPricesList = $product->getPriceInfo()->getPrice('tier_price')->getTierPriceList();
        foreach ($tierPricesList as $tierPrice) {
            $tierPrices[] = $this->priceCurrency->convert($tierPrice['price']->getValue());
        }
        $config = [
            'productId' => $product->getId(),
            'priceFormat' => $this->localeFormat->getPriceFormat(),
            'prices' => [
                'oldPrice' => [
                    'amount' => $this->priceCurrency->convert(
                        $product->getPriceInfo()->getPrice('regular_price')->getAmount()->getValue()
                    ),
                    'adjustments' => []
                ],
                'basePrice' => [
                    'amount' => $this->priceCurrency->convert(
                        $product->getPriceInfo()->getPrice('final_price')->getAmount()->getBaseAmount()
                    ),
                    'adjustments' => []
                ],
                'finalPrice' => [
                    'amount' => $this->priceCurrency->convert(
                        $product->getPriceInfo()->getPrice('final_price')->getAmount()->getValue()
                    ),
                    'adjustments' => []
                ]
            ],
            'idSuffix' => '_clone',
            'tierPrices' => $tierPrices
        ];

        $this->eventManager->dispatch('catalog_product_view_config', ['response_object' => $this->responseObject]);
        if (is_array($this->responseObject->getAdditionalOptions())) {
            foreach ($this->responseObject->getAdditionalOptions() as $option => $value) {
                $config[$option] = $value;
            }
        }

        return $this->jsonEncoder->encode($config);
    }

    public function getProductImage($product)
    {
        $imageSize = 100;
        $productImage = $this->imageHelper->init($product, 'category_page_list', ['height' => $imageSize , 'width'=> $imageSize])->getUrl();
        if (!$productImage) {
            return false;
        }
        return $productImage;
    }

    public function getStoreId()
    {
        return $this->storeManager->getStore()->getId();
    }

    public function getRedirectToCart()
    {
        return $this->scopeConfig->getValue(
            self::XML_PATH_REDIRECT_TO_CART,
            \Magento\Store\Model\ScopeInterface::SCOPE_STORE
        );
    }
}
