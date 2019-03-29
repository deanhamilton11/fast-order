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
namespace Bss\FastOrder\Controller\Index;

use Magento\Framework\View\Result\PageFactory;

class Option extends \Magento\Framework\App\Action\Action
{

    protected $resultPageFactory;

    protected $helperBss;

    protected $storeManager;

    protected $catalogModelProduct;

    /**
     * @var \Magento\Framework\Registry
     */
    protected $registry;

    public function __construct(
        \Magento\Framework\App\Action\Context $context,
        \Magento\Store\Model\StoreManagerInterface $storeManager,
        \Bss\FastOrder\Helper\Data $helperBss,
        \Magento\Catalog\Model\Product $catalogModelProduct,
        PageFactory $resultPageFactory,
        \Magento\Framework\Registry $registry
    ) {
        parent::__construct($context);
        $this->helperBss = $helperBss;
        $this->storeManager = $storeManager;
        $this->resultPageFactory = $resultPageFactory;
        $this->catalogModelProduct = $catalogModelProduct;
        $this->registry = $registry;
    }

    public function execute()
    {
        if (!$this->helperBss->getConfig('enabled')) {
            return false;
        }
        $storeId = $this->storeManager->getStore()->getId();
        $productId = $this->getRequest()->getParam('productId');
        $sortOrder = $this->getRequest()->getParam('sortOrder');
        $product = $this->catalogModelProduct->setStoreId($storeId)->load($productId);
        $resultPage = $this->resultPageFactory->create();
        $this->registry->unregister('current_product');
        $this->registry->register('current_product', $product);
        $html = $resultPage->getLayout()
                ->createBlock('Magento\Framework\View\Element\Template', '',
                ['data' => [
                    'sort_order' => $sortOrder
                    ]
                ])
                ->setTemplate('Bss_FastOrder::option.phtml')
                ->setProduct($product)
                ->toHtml();
        $result = [];
        $result['popup_option'] = $html;
        $this->getResponse()->setHeader('Content-type', 'application/json');
        $this->getResponse()->setBody(json_encode($result));
    }
}
