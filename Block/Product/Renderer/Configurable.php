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
 * @copyright  Copyright (c) 2017-2018 BSS Commerce Co. ( http://bsscommerce.com )
 * @license    http://bsscommerce.com/Bss-Commerce-License.txt
 */

namespace Bss\FastOrder\Block\Product\Renderer;

use Magento\Swatches\Block\Product\Renderer\Configurable as SwatchesConfigurable;
use Magento\Catalog\Block\Product\Context;
use Magento\Framework\Stdlib\ArrayUtils;
use Magento\Framework\Json\EncoderInterface;
use Magento\ConfigurableProduct\Helper\Data;
use Magento\Catalog\Helper\Product as CatalogProduct;
use Magento\Customer\Helper\Session\CurrentCustomer;
use Magento\Framework\Pricing\PriceCurrencyInterface;
use Magento\ConfigurableProduct\Model\ConfigurableAttributeData;
use Magento\Swatches\Helper\Data as SwatchData;
use Magento\Swatches\Helper\Media;
use Magento\Swatches\Model\SwatchAttributesProvider;

class Configurable extends SwatchesConfigurable
{
    /**
     * @var EncoderInterface
     */
    public $jsonEncoder;

    /**
     * @var \Bss\FastOrder\Helper\PreOrder
     */
    private $bssPreOrder;

    /**
     * Path to template file with Swatch renderer for fastorder module.
     */
    const FASTORDER_RENDERER_TEMPLATE = 'Bss_FastOrder::configurable.phtml';

    /**
     * @param Context $context
     * @param ArrayUtils $arrayUtils
     * @param EncoderInterface $jsonEncoder
     * @param Data $helper
     * @param CatalogProduct $catalogProduct
     * @param CurrentCustomer $currentCustomer
     * @param PriceCurrencyInterface $priceCurrency
     * @param ConfigurableAttributeData $configurableAttributeData
     * @param SwatchData $swatchHelper
     * @param Media $swatchMediaHelper
     * @param \Bss\FastOrder\Helper\PreOrder $bssPreOrder
     * @param array $data other data
     * @param SwatchAttributesProvider $swatchAttributesProvider
     * @SuppressWarnings(PHPMD.ExcessiveParameterList)
     */
    public function __construct(
        Context $context,
        ArrayUtils $arrayUtils,
        EncoderInterface $jsonEncoder,
        Data $helper,
        CatalogProduct $catalogProduct,
        CurrentCustomer $currentCustomer,
        PriceCurrencyInterface $priceCurrency,
        ConfigurableAttributeData $configurableAttributeData,
        SwatchData $swatchHelper,
        Media $swatchMediaHelper,
        \Bss\FastOrder\Helper\PreOrder $bssPreOrder,
        array $data = [],
        SwatchAttributesProvider $swatchAttributesProvider = null
    ) {
        parent::__construct(
            $context,
            $arrayUtils,
            $jsonEncoder,
            $helper,
            $catalogProduct,
            $currentCustomer,
            $priceCurrency,
            $configurableAttributeData,
            $swatchHelper,
            $swatchMediaHelper,
            $data,
            $swatchAttributesProvider
        );
        $this->bssPreOrder = $bssPreOrder;
        $this->jsonEncoder = $jsonEncoder;
    }
    /**
     * Return renderer template
     *
     * @return string
     */
    protected function getRendererTemplate()
    {
		return self::FASTORDER_RENDERER_TEMPLATE;
    }

    public function getJsonChildProductData()
    {
        if ($this->bssPreOrder->getEnable()) {
            return $this->jsonEncoder->encode(
                $this->bssPreOrder->getAllData(
                    $this->getProduct()->getId()
                )
            );
        }
        return false;
    }
}
